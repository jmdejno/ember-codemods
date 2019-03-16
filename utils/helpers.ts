import { lifecycleHooks } from "./constants";
import { NodePath } from "recast";
import { JSCodeshift, Property, Identifier } from "jscodeshift";
import { Collection } from "jscodeshift/src/Collection";

export const lifecycleHookOrder: lifecycleHooks[] = [
  lifecycleHooks.INIT,
  lifecycleHooks.SETUP_CONTROLLER,
  lifecycleHooks.DID_RECIECE_ATTRS,
  lifecycleHooks.WILL_RENDER,
  lifecycleHooks.DID_INSERT_ELEMENT,
  lifecycleHooks.DID_RENDER,
  lifecycleHooks.DID_UPDATE_ATTRS,
  lifecycleHooks.WILL_UPDATE,
  lifecycleHooks.WILL_DESTORY,
  lifecycleHooks.WILL_DESTROY_ELEMENT,
  lifecycleHooks.WILL_CLEAR_RENDER,
  lifecycleHooks.DID_DESTROY_ELEMENT,
  lifecycleHooks.RESET_CONTROLLER
];

export function isPrivateProperty(
  j: JSCodeshift,
  path: NodePath<Property>
): boolean {
  const { node } = path;
  const id = j.Identifier.check(node.key) && (node.key as Identifier);
  return !!(id && id.name && id.name[0] === "_");
}
