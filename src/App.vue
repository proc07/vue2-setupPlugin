<template>
  <div id="app">
    <h1>demo</h1>
    <img  width="25%" src="./assets/logo.png">
    <p>{{'x:' + x +' - y:'+ y }}</p>
    <div>
      mergeData: {{ obj }}
      total: {{ total }} <button @click="increment">add + 1</button>
    </div>
    <HelloWorld msg="child component"/>
  </div>
</template>

<script>
import HelloWorld from "./components/HelloWorld";

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

/* eslint-disable */
export default {
  name: "App",
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

    // onMounted(() => {
    //   console.log('mounted => 2')
    //   console.log('props: ', props)
    // })

    // const unwatch = watch('obj', (newVal, oldVal) => {
    //   console.log('watch, string: obj', newVal, oldVal)
    // }, { deep: true })
    // unwatch()
    // setTimeout(() => {unwatch()}, 2000)
    // watch(obj, (newVal, oldVal) => {
    //   console.log('watch, data: obj', newVal, oldVal)
    // }, { deep: true })
    // watch(total, (newVal, oldVal) => {
    //   console.log('watch, computed: total', newVal, oldVal)
    // })
    // watch([x, y], (newVal, oldVal) => {
    //   console.log('watch [x, y]', newVal, oldVal)
    // })

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
  // provide () {
  //   return {
  //     objdata: this.obj
  //   }
  // },
  data() {
    return {
      obj: { d: 4 }
    };
  },
  computed: {
    computedObj() {
      const { a, b, c, d } = this.obj;
      return a + b + c + d;
    }
  },
  // mounted () {
  //   console.log('mounted => 1')
  // },
  components: {
    HelloWorld
  }
};
</script>

<style>
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
