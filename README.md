### setup-plugin

看到vue3的组合式api文档，自己也有了一个类似的想法。

### 用法

```js

function useMousePosition(compApi) {
  const { data, onMounted, onUnmounted } = compApi;
  const x = data(0)
  const y = data(0)

  function update(e) {
    x.value = e.pageX
    y.value = e.pageY
  }

  onMounted(() => {
    window.addEventListener('mousemove', update)
  })
  onUnmounted(() => {
    window.removeEventListener('mousemove', update)
  })

  return { x, y }
}

export default {
  setup(compApi, vm) {
    const { provide, props, data, computed, watch, onMounted } = compApi;
    const { x, y } = useMousePosition(compApi)
    const obj = data({ a: 1, b: 2, c: 3 });
    const total = computed(() => {
      // good: anonymous function use 'this'
      // bad: arrow function use 'this'
      return obj.value.a + 1;
    });

    provide('foo', obj)

    onMounted(() => {
      console.log('mounted => 2')
      console.log('props: ', props)
    })

    const unwatch = watch('obj', (newVal, oldVal) => {
      console.log('watch, string: obj', newVal, oldVal)
    }, { deep: true })
    setTimeout(() => {unwatch()}, 2000)
    watch(obj, (newVal, oldVal) => {
      console.log('watch, data: obj', newVal, oldVal)
    }, { deep: true })
    watch(total, (newVal, oldVal) => {
      console.log('watch, computed: total', newVal, oldVal)
    })
    watch([x, y], (newVal, oldVal) => {
      console.log('watch [x, y]', newVal, oldVal)
    })

    function increment() {
      // good: this.obj.a++;
      obj.value.a++
    }

    return {
      x, y,
      obj,
      total,
      increment
    };
  },
}
```
