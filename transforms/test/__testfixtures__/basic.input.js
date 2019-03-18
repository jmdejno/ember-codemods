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
  lix: service()
});
