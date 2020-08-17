### setup-plugin

在我以前开发的后台管理项目中，其中有个 `收银台` 页面，一个文件代码量达到了5千行，去除掉html css，js大概都有3千行，这是个可怕的数字！
当然我可以拆成更多的子组件来减少代码量，但是某些复杂业务的情况下，拆开来会使得数据传递复杂度增加，渲染组件比直接渲染元素要耗费更多的性能，这需要去衡量！但这代码量太大也是个问题，可读性非常不好。在这样一个组件中写入这么多业务代码是否合理呢？
看一下 `组件的定义：按照页面中的一些功能的通用性和可复用性来抽象组件。` 虽然说这个页面本意上并非一个组件，但我们又把页面已组件形式定义（.vue文件）。导致了这个组件里面包含了全部的业务代码，是不是有点不太对劲？
vue3最新的组合式api，很好的解决了项目遇到的问题。代码组织、复用、可读性有很大的提升。自己也有了一个实现的想法，写了一些功能。

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
