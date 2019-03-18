import { emberLifecycleHooks } from "./constants";
import { NodePath } from "recast";
import { JSCodeshift, Property, Identifier, ObjectProperty } from "jscodeshift";

export const lifecycleHookOrder: emberLifecycleHooks[] = [
  emberLifecycleHooks.INIT,
  emberLifecycleHooks.SETUP_CONTROLLER,
  emberLifecycleHooks.DID_RECIECE_ATTRS,
  emberLifecycleHooks.WILL_RENDER,
  emberLifecycleHooks.DID_INSERT_ELEMENT,
  emberLifecycleHooks.DID_RENDER,
  emberLifecycleHooks.DID_UPDATE_ATTRS,
  emberLifecycleHooks.WILL_UPDATE,
  emberLifecycleHooks.WILL_DESTORY,
  emberLifecycleHooks.WILL_DESTROY_ELEMENT,
  emberLifecycleHooks.WILL_CLEAR_RENDER,
  emberLifecycleHooks.DID_DESTROY_ELEMENT,
  emberLifecycleHooks.RESET_CONTROLLER
];

export function isPropertyOf(
  j: JSCodeshift,
  path: NodePath<Property | ObjectProperty>,
  name: string
): boolean {
  if (!j.ObjectProperty.check(path.node)) {
    return false;
  }
  const obj = path.parent;
  const callExpression =
    j.CallExpression.check(obj.parent.node) && obj.parent.node;
  const id =
    callExpression &&
    j.MemberExpression.check(callExpression.callee) &&
    (callExpression.callee.object as Identifier);
  return id && id.name === name;
}

export function isNamedObjectPropertyOf(
  j: JSCodeshift,
  path: NodePath<ObjectProperty>,
  propName: string,
  objName: string
) {
  const { node } = path;
  const key = node && j.Identifier.check(node.key) && node.key;
  return !!(
    isPropertyOf(j, path, objName) &&
    key &&
    key.name &&
    key.name === propName
  );
}

export function isPrivateProperty(
  j: JSCodeshift,
  path: NodePath<Property | ObjectProperty>
): boolean {
  const { node } = path;
  const id = j.Identifier.check(node.key) && (node.key as Identifier);
  return !!(id && id.name && id.name[0] === "_");
}
