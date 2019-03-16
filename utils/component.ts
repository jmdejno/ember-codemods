import { Collection } from "jscodeshift/src/Collection";
import { JSCodeshift, Property, ObjectExpression } from "jscodeshift";
import { emberComponentProps, lifecycleHooks } from "./constants";
import { NodePath } from "recast";
import { isPrivateProperty } from "./helpers";

export class Component {
  public static build(j: JSCodeshift, root: Collection<any>): Component {
    Component.jscodeshift = j;
    return new Component(root);
  }

  public static isEmberCompoentProp(j: JSCodeshift, path: NodePath<Property>) {
    const { node } = path;
    const key = j.Identifier.check(node.key) && node.key;
    return !!(
      key &&
      key.name &&
      Object.values(emberComponentProps).some(
        emberProp => emberProp === key.name
      )
    );
  }

  public static isEmberLifecycleHook(
    j: JSCodeshift,
    path: NodePath<Property>
  ): boolean {
    const { node } = path;
    const key = j.Identifier.check(node.key) && node.key;
    return !!(
      key &&
      key.name &&
      Object.values(lifecycleHooks).some(emberProp => emberProp === key.name)
    );
  }

  private static _getComponent(root: Collection<any>): Collection<any> {
    const j = Component.jscodeshift;
    const component = root.find(j.ExportDefaultDeclaration, {
      declaration: { callee: { object: { name: "Component" } } }
    });
    return component;
  }

  private static _findServices(component: Collection<any>): Collection<any> {
    const j = Component.jscodeshift;
    return component.find(j.Property, {
      value: { callee: { name: "service" } }
    });
  }

  private static _findProps(
    component: Collection<any>
  ): {
    emberProps: Collection<any>;
    publicProps: Collection<any>;
    privateProps: Collection<any>;
    hooks: Collection<any>;
  } {
    const j = Component.jscodeshift;
    const emberProps = component.find(j.Property, p =>
      Component.isEmberCompoentProp(j, p)
    );
    const hooks = component.find(j.Property, p =>
      Component.isEmberLifecycleHook(j, p)
    );
    const nonEmberProps = component.find(
      j.Property,
      p =>
        !Component.isEmberCompoentProp(j, p) &&
        !Component.isEmberLifecycleHook(j, p)
    );
    const publicProps = nonEmberProps.filter(p => !isPrivateProperty(j, p));
    const privateProps = nonEmberProps.filter(p => isPrivateProperty(j, p));
    return { emberProps, publicProps, privateProps, hooks };
  }

  private static jscodeshift: JSCodeshift;

  private _component: Collection<any>;
  private _services: Collection<any>;
  private _emberProps: Collection<any>;
  private _publicProps: Collection<any>;
  private _privateProps: Collection<any>;
  // private _singleLineComputedProps: Collection<any>;
  // private _mutliLineComputeProps: Collection<any>;
  private _lifecycleHooks: Collection<any>;
  // private _actions: Collection<any>;
  // private _privateMethods: Collection<any>;

  private constructor(root: Collection<any>) {
    this._component = Component._getComponent(root);
    this._services = Component._findServices(this._component);
    const {
      emberProps,
      publicProps,
      privateProps,
      hooks
    } = Component._findProps(this._component);
    this._emberProps = emberProps;
    this._publicProps = publicProps;
    this._privateProps = privateProps;
    this._lifecycleHooks = hooks;
    console.log(this);
  }
}
