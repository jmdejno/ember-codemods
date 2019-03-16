declare module 'codemod-cli' {

  /**
   * Run transforms
   * @param base - current directory
   * @param transform - dir or path of transform to run
   * @param globs - glob or path to run transform on
   */
  function runTransform(base: string, transform: string, globs: string[]): void
}