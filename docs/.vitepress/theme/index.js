import DefaultTheme from 'vitepress/theme';
import FleetDashboard from './components/FleetDashboard.vue';
import './custom.css';

export default {
  ...DefaultTheme,
  enhanceApp({ app }) {
    app.component('FleetDashboard', FleetDashboard);
  }
};
