export enum lifecycleHooks {
  INIT = 'init',
  SETUP_CONTROLLER = 'setupController',
  DID_RECIECE_ATTRS = 'didReceiveAttrs',
  WILL_RENDER = 'willRender',
  DID_INSERT_ELEMENT = 'didInsertElement',
  DID_RENDER = 'didRender',
  DID_UPDATE_ATTRS = 'didUpdateAttrs',
  WILL_UPDATE = 'willUpdate',
  WILL_DESTORY  = 'willDestory',
  WILL_DESTROY_ELEMENT = 'willDestroyElement',
  WILL_CLEAR_RENDER = 'willClearRender',
  DID_DESTROY_ELEMENT = 'didDestroyElement',
  RESET_CONTROLLER = 'resetController'
}

export enum emberComponentProps {
  CLASS_NAMES = "classNames",
  CLASS_NAME_BINDINGS = "classNameBindings",
  TAG_NAME = "tagName",
  ATTR_BINDINGS = "attributeBindings",
  LAYOUT = 'layout'
}