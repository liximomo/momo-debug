import { isPlainObject, assert, parsePropsPath } from './utils';

const toRaw = new WeakMap<Intercepter, any>();
const toIntercepter = new WeakMap<any, Intercepter>();
const knownIntercepter = new WeakSet();

type PropName = string | number | symbol;

interface InterceptionConfig {
  get?: boolean;
  set?: boolean;
  delete?: boolean;
  call?: boolean;
  disable?: boolean;
}

type ConfigKeys = keyof InterceptionConfig;

const CleanConfig = {
  get: false,
  set: false,
  delete: false,
  call: false,
};

function inferDefaultConfig(target: any): Partial<InterceptionConfig> {
  if (typeof target === 'function') {
    return {
      call: true,
    };
  } else {
    return {
      set: true,
      delete: true,
    };
  }
}

function createConfig(
  keys: ConfigKeys[],
  value: boolean
): Partial<InterceptionConfig> {
  return keys.reduce(
    (acc, key) => {
      acc[key] = value;
      return acc;
    },
    {} as InterceptionConfig
  );
}

class Intercepter<T extends object = Record<any, any>> {
  private _interceptionConfig!: InterceptionConfig;
  private _propsInterceptionConfig: Map<
    PropName,
    Partial<InterceptionConfig>
  > = new Map();
  private _proxied!: T;
  private _raw: T;

  constructor(target: T) {
    this._raw = target;
    this.reset();
  }

  read(prop?: PropName) {
    this.toggleConfigKeys(['get'], true, prop);
    return this;
  }

  write(prop?: PropName) {
    this.toggleConfigKeys(['set'], true, prop);
    return this;
  }

  writeDelete(prop?: PropName) {
    this.toggleConfigKeys(['set', 'delete'], true, prop);
    return this;
  }

  call(prop: PropName) {
    if (typeof (this._raw as any)[prop] === 'function') {
      this.prop(prop);
    }
    return this;
  }

  enable(prop?: PropName) {
    this.toggleConfigKeys(['disable'], true, prop);
    return this;
  }

  disable(prop?: PropName) {
    this.toggleConfigKeys(['disable'], false, prop);
    return this;
  }

  reset() {
    this._interceptionConfig = {
      ...CleanConfig,
      ...inferDefaultConfig(this._raw),
    };
    return this;
  }

  getProxy() {
    if (this._proxied) {
      return this._proxied;
    }

    const self = this;
    this._proxied = new Proxy<any>(this._raw, {
      apply(target, thisArg, argumentsList) {
        const config = self.getConfig();
        if (!config.disable && config.call) {
          debugger;
        }
        return Reflect.apply(target, thisArg, argumentsList);
      },
      get(target, prop, receiver) {
        const config = self.getConfigForProp(prop);
        if (!config.disable && config.get) {
          debugger;
        }
        return Reflect.get(target, prop, receiver);
      },
      set(target, prop, value) {
        const config = self.getConfigForProp(prop);
        if (!config.disable && config.set) {
          debugger;
        }
        return Reflect.set(target, prop, value);
      },
      deleteProperty(target, prop) {
        const config = self.getConfigForProp(prop);
        if (!config.disable && config.delete) {
          debugger;
        }
        return Reflect.deleteProperty(target, prop);
      },
    });

    return this._proxied;
  }

  prop(prop: PropName): Intercepter {
    let parent: any;
    let childPropName: PropName;
    if (typeof prop !== 'string') {
      parent = this._raw;
      childPropName = prop;
    } else {
      const segments = parsePropsPath(prop);
      if (segments.length === 1) {
        parent = this._raw;
        childPropName = prop;
      } else {
        childPropName = segments.pop()!;
        for (let i = 0; i < segments.length; i++) {
          parent = (this._raw as any)[segments[i]];
        }
      }
    }

    if (knownIntercepter.has(parent)) {
      parent = toRaw.get(parent);
    }

    const proxied = (parent[childPropName] = new Intercepter(
      parent[childPropName]
    ).getProxy());

    return proxied;
  }

  protected toggleConfigKeys(
    keys: ConfigKeys[],
    value: boolean,
    prop?: PropName
  ) {
    const modified = createConfig(keys, value);
    if (prop !== undefined) {
      let config = this._propsInterceptionConfig.get(prop);
      if (config) {
        Object.assign(config, modified);
      } else {
        this._propsInterceptionConfig.set(prop, modified);
      }
    } else {
      Object.assign(this._interceptionConfig, modified);
    }
  }

  protected getConfig(): InterceptionConfig {
    return this._interceptionConfig;
  }

  protected getConfigForProp(prop: PropName): InterceptionConfig {
    return {
      ...this.getConfig(),
      ...this._propsInterceptionConfig.get(prop),
    };
  }
}

export default function intercept(target: object) {
  assert(
    isPlainObject(target),
    `"intercept()" require an "object", got ${typeof target}`
  );

  if (knownIntercepter.has(target)) {
    return target;
  }
  if (toIntercepter.has(target)) {
    return toIntercepter.get(target);
  }

  const intercepter = new Intercepter(target);
  knownIntercepter.add(intercepter);
  toIntercepter.set(target, intercepter);
  toRaw.set(intercepter, target);

  return intercepter;
}
