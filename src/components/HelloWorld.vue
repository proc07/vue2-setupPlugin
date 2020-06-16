<template>
  <div class="hello" ref="root">
    <h1>{{ msg }}</h1>
    <h2>{{ foo }}</h2>
    <div v-for="(item, i) in list" :key="i" ref="divs">{{ item }}</div>
  </div>
</template>

<script>
export default {
  name: "HelloWorld",
  setup(compApi) {
    const { ref, data, inject, onMounted } = compApi
    const foo = inject('foo')
    const list = data([1, 2, 3])

    const divs = ref([])
    const root = ref(null)
    onMounted(() => {
      // 在渲染完成后, 这个 div DOM 会被赋值给 root ref 对象
      console.log(divs.value, root.value) // <div/>
    })

    return {
      foo,
      list,
      divs,
      root
    }
  },
  props: {
    msg: String
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
