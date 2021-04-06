export default class SetUp {}

const LIFECYCLE_HOOKS = {
  beforeMount: 'onBeforeMount',
  mounted: 'onMounted',
  beforeUpdate: 'onBeforeUpdate',
  updated: 'onUpdated',
  beforeDestroy: 'onBeforeUnmount',
  destroyed: 'onUnmounted',
  errorCaptured: 'onErrorCaptured'
}
const REF_DATA = "DATA";
const REF_EL = 'ELEMENT'
const REF_COMPUTED = "COMPUTED";
const REF_INJECT = 'INJECT';

function hasOwn(obj, key) {
  // obj.hasOwnProperty Sometimes problems arise
  return Object.prototype.hasOwnProperty.call(obj, key);
}
// eslint-disable-next-line
function noopFn() {}
function isObject(val) {
  return Object.prototype.toString.call(val) === "[object Object]";
}
function isArray(val) {
  return Object.prototype.toString.call(val) === "[object Array]";
}
// function isStringFunction(str) {
//   return typeof str === 'string' && str.indexOf('function') !== -1
// }
function generateUnique() {
  return Math.random().toString(32).slice(2)
}
function mergeData(from, to) {
  const keys = Object.keys(from);

  for (let i = 0; i < keys.length; i++) {
    let key = keys[i];
    let toVal = to[key];
    let fromVal = from[key];

    if (!hasOwn(to, key)) {
      to[key] = fromVal;
    } else if (fromVal !== toVal && isObject(toVal) && isObject(fromVal)) {
      mergeData(fromVal, toVal);
    }
  }

  return to;
}
function mergedInstanceDataFn (parentVal, childVal, vm) {
  // instance merge
  var instanceData = typeof childVal === 'function'
    ? childVal.call(vm, vm)
    : childVal;
  var defaultData = typeof parentVal === 'function'
    ? parentVal.call(vm, vm)
    : parentVal;
  if (instanceData) {
    return mergeData(instanceData, defaultData)
  } else {
    return defaultData
  }
}

SetUp.install = function(Vue) {
  const strats = Vue.config.optionMergeStrategies;

  function beforeCreateHook() {
    const vm = this;
    const $options = vm.$options;
    const {
      setup,
      data = {},
      computed = {},
      methods = {},
      provide = {},
      inject = {}
    } = $options;
    // console.log("beforeCreate", vm);

    if (setup) {
      const setupOptions = setup(vm.$parent.$options.propsData, vm);

      // 不使用 mergeData 对象方式承载，初始化时还未被监听，导致响应数据失败
      $options.provide = function mergedProvideDataFn() {
        return mergedInstanceDataFn(provide, function setupProvideFn() {
          const result = {}
          const _provide = setupOptions.provide
          for (const key in _provide) {
            if (_provide[key].__TYPE__) {
              result[key] = vm[setupOptions[_provide[key].unique]]
            } else {
              result[key] = _provide[key]
            }
          }
          return result
        }, vm)
      }

      $options.inject = mergeData(setupOptions.inject, inject)

      $options.data = function() {
        const default_data =
          typeof data === "function" ? data.call(vm, vm) : data;
        return mergeData(setupOptions.data, default_data);
      };

      // call computed fucntion
      const setupComputed = {};
      for (const key in setupOptions.computed) {
        setupComputed[key] = setupOptions.computed[key](vm);
      }
      $options.computed = mergeData(setupComputed, computed)
      // merge methods
      $options.methods = mergeData(setupOptions.methods, methods)
      // merge hooks
      for (const keyHook in LIFECYCLE_HOOKS) {
        if ($options[keyHook]) {
          $options[keyHook].push(...setupOptions[keyHook])
        } else {
          $options[keyHook] = setupOptions[keyHook]
        }
      }
      // binding watch
      $options.created = $options.created || []
      $options.created.push(function bindingWatch() {
        setupOptions.watch.forEach(watchItem => {
          // Array.Map cannot be replaced!
          watchItem.watchFns.forEach((fn, indx) => {
            watchItem.watchFns[indx] = fn(vm)
          })
          // replace the original function
          watchItem.unwatchFn = function() {
            watchItem.watchFns.map(fn => fn())
          }
        })
      })

    }
  }

  Vue.mixin({
    beforeCreate: beforeCreateHook
  });

  strats.setup = function(parent, child) {
    function resolveInject(source, provideKey) {
      while (source) {
        if (source._provided && hasOwn(source._provided, provideKey)) {
          return source._provided[provideKey]
        }
        source = source.$parent
      }
    }

    // console.log(parent, child);
    return function SetUpFn(propsData, context) {
      const $options = {
        refs: {},
        data: {},
        computed: {},
        methods: {},
        watch: [],
        provide: {},
        inject: {}
      };
      const compositionApi = {
        props: propsData,
        refs(val) {
          let _val = val
          return {
            unique: generateUnique(),
            // set value(val) {
            //   _val = val
            //   const key = $options[this.unique]
            //   if (key) {
            //     context.$refs[key] = val
            //   }
            // },
            get value() {
              const key = $options[this.unique]
              return context.$refs[key] || _val
            },
            __TYPE__: REF_EL
          }
        },
        reactive(val) {
          console.log(val)
        },
        ref(val) {
          let _val = val
          return {
            unique: generateUnique(),
            set value(val) {
              _val = val
              const key = $options[this.unique]
              if (key) {
                context[key] = val
              }
            },
            get value() {
              const key = $options[this.unique]
              return context[key] || _val
            },
            __TYPE__: REF_DATA
          };
        },
        computed(func) {
          return {
            unique: generateUnique(),
            value: function computedFn(vm) {
              return function() {
                return func.call(vm, vm);
              };
            },
            __TYPE__: REF_COMPUTED
          };
        },
        watch(source, callback, options = {}) {
          const watchWrap = {
            watchFns: [],
            unwatchFn() {
              watchWrap.watchFns = []
            }
          }

          const sourceList = isArray(source) ? source : [source]
          sourceList.forEach(source => {
            watchWrap.watchFns.push(function watchFn(vm) {
              const _source = source.__TYPE__ ? $options[source.unique] : source
              return vm.$watch(_source, callback, options)
            })
          })
          $options.watch.push(watchWrap)

          return function() {
            watchWrap.unwatchFn()
          }
        },
        provide(key, value) {
          $options.provide[key] = value
        },
        inject(key, defaultValue) {
          const refOrValue = resolveInject(context, key) || defaultValue
          return {
            unique: generateUnique(),
            value: hasOwn(refOrValue, '__TYPE__') ? refOrValue.value : refOrValue,
            defaultValue,
            __TYPE__: REF_INJECT
          }
        }
      };

      // init lifecycle hooks
      for (const keyHook in LIFECYCLE_HOOKS) {
        $options[keyHook] = []
        compositionApi[LIFECYCLE_HOOKS[keyHook]] = function(hookFunc) {
          $options[keyHook].push(hookFunc)
        }
      }

      const data = child(compositionApi, context);

      for (const key in data) {
        const refValue = data[key]
        const refType = refValue.__TYPE__;

        // unique: Used to confirm the key value in the data
        refValue.unique && ($options[refValue.unique] = key)

        switch(refType) {
          case REF_DATA:
            $options.data[key] = refValue.value;
            break;
          case REF_EL:
              $options.refs[key] = refValue.value;
              $options.data[key] = refValue.value;
              break;
          case REF_COMPUTED:
            $options.computed[key] = refValue.value;
            break;
          case REF_INJECT:
            $options.inject[key] = {
              default: refValue.defaultValue,
              from: key
            }
            break;
          default:
            $options.methods[key] = refValue;
        }
      }
      return $options;
    };
  };
};
