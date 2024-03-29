import { Collection } from "jscodeshift/src/Collection";
import {
  JSCodeshift,
  ObjectProperty,
  Identifier,
  ObjectMethod,
  Program,
  File
} from "jscodeshift";
import {
  emberComponentProps,
  emberLifecycleHooks,
  emberObjectTypes
} from "./constants";
import { NodePath } from "recast";
import {
  isPrivateProperty,
  isPropertyOf,
  isNamedObjectPropertyOf,
  isSingleLineProperty,
  findObjectPropsBy,
  isMultilineProperty,
  getNodes,
  insertLineBeforeObjectProps
} from "./helpers";

export class Component {
  //#region public statics

  public static build(j: JSCodeshift, root: Collection<File>): Component {
    Component.jscodeshift = j;
    return new Component(root);
  }

  public static isEmberComponentProp(
    j: JSCodeshift,
    path: NodePath<ObjectProperty>
  ) {
    const { node } = path;
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
    path: NodePath<ObjectProperty | ObjectMethod>
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
    path: NodePath<ObjectProperty | ObjectMethod>
  ): boolean {
    return isPropertyOf(j, path, emberObjectTypes.COMPONENT);
  }

  // #endregion

  //#region private statics

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
  ): { props: Collection<ObjectProperty>; methods: Collection<ObjectMethod> } {
    const j = this.jscodeshift;
    const props = component
      .find(j.ObjectProperty)
      .filter(path => this.isEmberLifecycleHook(j, path));

    const methods = component
      .find(j.ObjectMethod)
      .filter(path => this.isEmberLifecycleHook(j, path));

    return { props, methods };
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
    foundProps: WeakSet<ObjectProperty | ObjectMethod>
  ): {
    publicProps: Collection<ObjectProperty>;
    privateProps: Collection<ObjectProperty>;
    privateMethods: Collection<ObjectMethod>;
    publicMethods: Collection<ObjectMethod>;
  } {
    const j = Component.jscodeshift;
    const nonEmberProps = component
      .find(j.ObjectProperty)
      .filter(p => !foundProps.has(p.node));

    const publicProps = nonEmberProps.filter(
      p => !isPrivateProperty(j, p) && this.isComponentObjectProperty(j, p)
    );
    const privateProps = nonEmberProps.filter(
      p => isPrivateProperty(j, p) && this.isComponentObjectProperty(j, p)
    );

    const nonEmberMethods = component
      .find(j.ObjectMethod)
      .filter(p => !foundProps.has(p.node));
    const privateMethods = nonEmberMethods.filter(p =>
      this.isComponentObjectProperty(j, p)
    );
    const publicMethods = nonEmberMethods.filter(p =>
      this.isComponentObjectProperty(j, p)
    );
    return { publicProps, privateProps, privateMethods, publicMethods };
  }

  private static jscodeshift: JSCodeshift;

  // #endregion

  //#region private members
  private _root: Collection<File>;
  private _component: Collection<any>;
  private _services: Collection<ObjectProperty>;
  private _emberProps: Collection<ObjectProperty>;
  private _publicProps: Collection<ObjectProperty>;
  private _privateProps: Collection<ObjectProperty>;
  private _actions: Collection<ObjectProperty>;
  private _singleLineComputedProps: Collection<ObjectProperty>;
  private _mutliLineComputeProps: Collection<ObjectProperty>;
  private _lifecycleHooksProps: Collection<ObjectProperty>;
  private _lifecycleHooksMethods: Collection<ObjectMethod>;
  private _privateMethods: Collection<ObjectMethod>;
  private _foundObjectProps: WeakSet<
    ObjectProperty | ObjectMethod
  > = new WeakSet();

  // #endregion

  private constructor(root: Collection<File>) {
    this._root = root;
    this._component = Component._getComponent(root);
    this._findObjectProps(this._component);
  }

  public rebuild() {
    const j = Component.jscodeshift;
    const originalObj = this._component.get("declaration", "arguments", 0);
    const props = [
      this._services,
      this._emberProps,
      this._publicProps,
      this._privateProps,
      this._singleLineComputedProps,
      this._mutliLineComputeProps,
      this._lifecycleHooksProps,
      this._lifecycleHooksMethods,
      this._actions,
      this._privateMethods
    ];
    const obj = j.objectExpression(getNodes(...props));
    originalObj.replace(obj);

    insertLineBeforeObjectProps(j, ...props);

  }

  private _findObjectProps(component: Collection<any>) {
    const j = Component.jscodeshift;

    this._services = Component._findServices(component);
    this._emberProps = Component._findEmberProps(component);
    const { props, methods } = Component._findEmberLifecycleHooks(component);
    this._lifecycleHooksProps = props;
    this._lifecycleHooksMethods = methods;
    this._actions = Component._findComponentActions(component);
    this._singleLineComputedProps = findObjectPropsBy(
      j,
      component,
      isSingleLineProperty,
      emberObjectTypes.COMPONENT
    );
    this._mutliLineComputeProps = findObjectPropsBy(
      j,
      component,
      isMultilineProperty,
      emberObjectTypes.COMPONENT
    );
    this._addToFoundObjectProps(
      this._services,
      this._lifecycleHooksProps,
      this._lifecycleHooksMethods,
      this._emberProps,
      this._actions,
      this._singleLineComputedProps,
      this._mutliLineComputeProps
    );
    const {
      publicProps,
      privateProps,
      publicMethods,
      privateMethods
    } = Component._findNonEmberProps(component, this._foundObjectProps);
    this._publicProps = publicProps;
    this._privateProps = privateProps;
    this._privateMethods = privateMethods;
  }

  private _addToFoundObjectProps(
    ...props: (Collection<ObjectProperty | ObjectMethod>)[]
  ) {
    props.forEach(path =>
      path.nodes().forEach(node => this._foundObjectProps.add(node))
    );
  }
}
