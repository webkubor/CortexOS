import DefaultTheme from 'vitepress/theme';
import FleetDashboard from './components/FleetDashboard.vue';
import BrainAgentConsole from './components/BrainAgentConsole.vue';
import './custom.css';

export default {
  ...DefaultTheme,
  enhanceApp({ app }) {
    app.component('FleetDashboard', FleetDashboard);
    app.component('BrainAgentConsole', BrainAgentConsole);
  }
};
