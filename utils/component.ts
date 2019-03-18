import { Collection } from "jscodeshift/src/Collection";
import { JSCodeshift, ObjectProperty, Identifier } from "jscodeshift";
import {
  emberComponentProps,
  emberLifecycleHooks,
  emberObjectTypes
} from "./constants";
import { NodePath } from "recast";
import {
  isPrivateProperty,
  isPropertyOf,
  isNamedObjectPropertyOf
} from "./helpers";

export class Component {
  public static build(j: JSCodeshift, root: Collection<any>): Component {
    Component.jscodeshift = j;
    return new Component(root);
  }

  public static isEmberComponentProp(
    j: JSCodeshift,
    path: NodePath<ObjectProperty>
  ) {
    const { node } = path;
    debugger;
    const key = node && j.Identifier.check(node.key) && node.key;
    return !!(
      Component.isComponentObjectProperty(j, path) &&
      key &&
      key.name &&
      Object.values(emberComponentProps).some(
        emberProp => emberProp === key.name
      )
    );
  }

  public static isEmberLifecycleHook(
    j: JSCodeshift,
    path: NodePath<ObjectProperty>
  ): boolean {
    const { node } = path;
    const key = node && j.Identifier.check(node.key) && node.key;
    return !!(
      Component.isComponentObjectProperty(j, path) &&
      key &&
      key.name &&
      Object.values(emberLifecycleHooks).some(
        emberProp => emberProp === key.name
      )
    );
  }

  public static isComponentObjectProperty(
    j: JSCodeshift,
    path: NodePath<ObjectProperty>
  ): boolean {
    return isPropertyOf(j, path, emberObjectTypes.COMPONENT);
  }

  private static _getComponent(root: Collection<any>): Collection<any> {
    const j = Component.jscodeshift;
    return root.find(j.ExportDefaultDeclaration, {
      declaration: { callee: { object: { name: emberObjectTypes.COMPONENT } } }
    });
  }

  private static _findServices(component: Collection<any>): Collection<any> {
    const j = Component.jscodeshift;
    return component
      .find(j.ObjectProperty, {
        value: { callee: { name: "service" } }
      })
      .filter(path => Component.isComponentObjectProperty(j, path));
  }

  private static _findEmberLifecycleHooks(
    component: Collection<any>
  ): Collection<ObjectProperty> {
    const j = this.jscodeshift;
    return component
      .find(j.ObjectProperty)
      .filter(path => this.isEmberLifecycleHook(j, path));
  }

  private static _findEmberProps(
    component: Collection<any>
  ): Collection<ObjectProperty> {
    const j = this.jscodeshift;
    return component
      .find(j.ObjectProperty)
      .filter(path => this.isEmberComponentProp(j, path));
  }

  private static _findComponentActions(
    component: Collection<any>
  ): Collection<ObjectProperty> {
    const j = this.jscodeshift;
    return component
      .find(j.ObjectProperty)
      .filter(p =>
        isNamedObjectPropertyOf(j, p, "actions", emberObjectTypes.COMPONENT)
      );
  }

  private static _findNonEmberProps(
    component: Collection<any>,
    foundProps: WeakSet<ObjectProperty>
  ): {
    publicProps: Collection<ObjectProperty>;
    privateProps: Collection<ObjectProperty>;
  } {
    const j = Component.jscodeshift;
    const nonEmberProps = component
      .find(j.ObjectProperty)
      .filter(p => !foundProps.has(p.node));
    const publicProps = nonEmberProps.filter(p => !isPrivateProperty(j, p));
    const privateProps = nonEmberProps.filter(p => isPrivateProperty(j, p));
    return { publicProps, privateProps };
  }

  private static jscodeshift: JSCodeshift;

  private _component: Collection<any>;
  private _services: Collection<ObjectProperty>;
  private _emberProps: Collection<ObjectProperty>;
  private _publicProps: Collection<ObjectProperty>;
  private _privateProps: Collection<ObjectProperty>;
  private _actions: Collection<ObjectProperty>;
  // private _singleLineComputedProps: Collection<any>;
  // private _mutliLineComputeProps: Collection<any>;
  private _lifecycleHooks: Collection<ObjectProperty>;
  // private _privateMethods: Collection<any>;
  private _foundObjectProps: WeakSet<ObjectProperty> = new WeakSet();

  private constructor(root: Collection<any>) {
    this._component = Component._getComponent(root);
    this._findObjectProps(this._component);
  }

  public rebuild() {
    const j = Component.jscodeshift;
    const originalObj = this._component.get("declaration", "arguments", 0);
    const obj = j.objectExpression([
      ...this._services.nodes(),
      ...this._emberProps.nodes(),
      ...this._publicProps.nodes(),
      ...this._lifecycleHooks.nodes(),
      ...this._actions.nodes(),
      ...this._privateProps.nodes()
    ]);
    originalObj.replace(obj);
  }

  private _findObjectProps(component: Collection<any>) {
    this._services = Component._findServices(component);
    this._emberProps = Component._findEmberProps(component);
    this._lifecycleHooks = Component._findEmberLifecycleHooks(component);
    this._actions = Component._findComponentActions(component);
    this._addToFoundObjectProps(
      this._services,
      this._lifecycleHooks,
      this._emberProps,
      this._actions
    );
    const { publicProps, privateProps } = Component._findNonEmberProps(
      component,
      this._foundObjectProps
    );
    this._publicProps = publicProps;
    this._privateProps = privateProps;
  }

  private _addToFoundObjectProps(...props: Collection<ObjectProperty>[]) {
    props.forEach(path =>
      path.nodes().forEach(node => this._foundObjectProps.add(node))
    );
  }
}
