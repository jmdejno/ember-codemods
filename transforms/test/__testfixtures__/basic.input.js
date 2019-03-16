import { A as emberArray } from "@ember/array";
import { computed } from "@ember/object";
import { readOnly, or } from "@ember/object/computed";
import { inject as service } from "@ember/service";
import Component from "@ember/component";
import disableOptions from "learning-web/utils/course/quiz/disable-options";

const reviewQuestionAnimations = Object.freeze({
  nextQuestion: "toLeft",
  previousQuestion: "toRight"
});

export default Component.extend({
  tracking: service(),
  user: service(),
  lix: service(),

  classNames: ["chapter-quiz"],

  isAttempted: false,
  quiz: null,
  canTryAgain: false,
  showResult: false,
  questionIndex: 0,
  questions: readOnly("quiz.questions"),
  responses: readOnly("quiz.status.details.responses"),
  reviewQuestionAnimation: reviewQuestionAnimations.nextQuestion,
  canViewSocialQuestions: false,
  shouldShowSocialQuestionsBtn: false,

  /**
   * Determine next question using `questionIndex` and `questions` length.
   * @return {[bool]}
   */
  hasNextQuestion: computed(
    "questionIndex",
    "questions",
    function hasNextQuestion() {
      return this.get("questionIndex") < this.get("questions.length") - 1;
    }
  ),

  /**
   * Retrieve question from questions array using questionIndex.
   * @return {[question]}   [Object]
   */
  question: computed("questions", "questionIndex", function question() {
    const questions = this.get("questions");

    return questions.objectAt(this.get("questionIndex"));
  }),

  showFooter: or("showResult", "isReviewMode", "isAttempted").readOnly(),

  init() {
    this._super(...arguments);
    this._attrsCache = {
      isOpen: this.get("isOpen")
    };

    this.set(
      "shouldShowSocialQuestionsBtn",
      this.get("canViewSocialQuestions") &&
        this.get("lix").getTreatmentIsEnabled(
          "learning.client.social.quiz-qa-redirect"
        )
    );
    this.get("tracking").setupTrackableComponent(this);
  },

  didUpdateAttrs() {
    this._super(...arguments);

    const isOpen = this.get("isOpen");
    const isOpenChanged = this._attrsCache.isOpen !== isOpen;

    if (isOpenChanged) {
      // Once modal is closed and re-opened we need to reset attributes because
      // component is not truly destroyed but only modal is destroyed.
      this._reset();
      this._attrsCache.isOpen = isOpen;
    }
  },

  actions: {
    selectOption({ question, optionIndex }) {
      const quizStatus = this.get("quiz.status");

      return quizStatus
        .save({
          adapterOptions: {
            action: "submitResponse",
            assessmentUrn: this.get("quiz.urn"),
            assessmentResponse: {
              question: question.get("urn"),
              optionIds: [parseInt(optionIndex, 10)]
            }
          }
        })
        .then(status => {
          if (this.get("isDestroyed") || this.get("isDestroying")) {
            return;
          }

          const quiz = this.get("quiz");
          const questionUrn = question.get("urn");
          const responses = status.getWithDefault(
            "details.responses",
            emberArray()
          );
          const quizQuestion = quiz.get("questions").findBy("urn", questionUrn);
          const questionSubmissions = responses.findBy("question", questionUrn);
          let optionsLength = question.getWithDefault("options", []).length;
          let submissions = emberArray();
          optionsLength = Math.max(--optionsLength, 0);

          if (questionSubmissions) {
            submissions = questionSubmissions.getWithDefault(
              "submissions",
              submissions
            );
          }
          const withMaximumAttempts = submissions.length >= optionsLength;
          const isCorrect = submissions.get("lastObject.correct");

          // Once we get quiz status update, we need to find submissions made and
          // update attempted options with disabled state.
          disableOptions({
            questionUrn,
            options: quizQuestion.get("options"),
            responses
          });

          this.setProperties({
            isAttempted: true,
            canTryAgain:
              !isCorrect && !withMaximumAttempts && submissions.length > 0
          });
        });
    },

    triggerResults() {
      this.set("showResult", true);

      const triggerResults = this.getWithDefault("triggerResults", () => {});
      triggerResults();
    },

    retryQuestion() {
      this.set("isAttempted", false);
    },

    openModal() {
      this.set("isOpen", true);
    },

    closeModal() {
      this.set("isOpen", false);
    },

    nextQuestion(reset = false) {
      this.incrementProperty("questionIndex");
      this.set(
        "reviewQuestionAnimation",
        reviewQuestionAnimations.nextQuestion
      );

      if (reset) {
        this._reset();
      }
    },

    previousQuestion() {
      this.decrementProperty("questionIndex");
      this.set(
        "reviewQuestionAnimation",
        reviewQuestionAnimations.previousQuestion
      );
    },

    quitQuiz() {
      this.onQuit();
    }
  },

  _reset() {
    this.setProperties({
      isAttempted: false,
      canTryAgain: false
    });
  }
});
