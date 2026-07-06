import { mount } from 'svelte';
import App from './App.svelte';
import '@/assets/styles/tokens.css';
import '@/assets/styles/base.css';
import '@/assets/styles/components.css';
import '@/assets/styles/font.css';

const target = document.getElementById('app');
if (!target) throw new Error('Не найден корневой элемент #app');

export default mount(App, { target });
