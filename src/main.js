import Vue from "vue";
import App from "./App.vue";
import SetUp from "./plugin/setup";
Vue.config.productionTip = false;

Vue.use(SetUp);

new Vue({
  render: h => h(App),
  propsData: {
    msg: 'hello world'
  }
}).$mount("#app");
