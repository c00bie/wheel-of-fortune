<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, onMounted, provide, reactive, ref, watch } from 'vue';
import Wheel from './components/Wheel.vue';
import Word from './components/Word.vue';
import { useI18n } from 'vue-i18n';
import useStore, { State } from './store';
import { setLanguage } from './i18n';
import Settings from './components/Settings.vue';
import Controller from './components/Controller.vue';
import { _DeepPartial } from 'pinia';

const store = useStore();
const { t } = useI18n();
setLanguage(store.settings.language, true).then(() => {
  if (store.settings.charset.length == 0) {
    store.settings.charset = t('charset');
    store.settings.vowels = t('vowels');
  }
});
const settingsModal = ref(false);
const ctrl = ref(false);
const inst = getCurrentInstance();
provide('settingsOpen', settingsModal);

if (localStorage.getItem('settings')) {
  store.$patch(JSON.parse(localStorage.getItem('settings') as string))
}
else {
  (async () => {
    try {
      const pos = await import('./assets/pos.json');
      store.$patch({ wheel: { values: pos.default } })
      saveSettings();
    }
    catch (e) { }
  })();
}
store.setTeamCount(store.settings.teamCount);

function gotResult(res: number | null) {
  if (res === null) {
    if (store.settings.bankruptPerRound)
      store.teams[store.current].points[store.round] = 0;
    else
      store.teams[store.current].points = [0];
    store.reward = t('game.bankrupt');
  }
  else
    store.reward = res;
}

function score(sc: number | null = null) {
  if (store.teams[store.current].points.length-1 < store.round)
    store.teams[store.current].points.push(sc ?? store.reward as number);
  else
    store.teams[store.current].points[store.round] += sc ?? store.reward as number;
}

function vowel() {
  score(-store.settings.vowelPrice);
}

function totalScore(id: number) {
  let sum = 0;
  for (const sc of store.teams[id].points)
    sum += sc;
  return sum;
}

function setScore(id: number) {
  var score = prompt("Wynik:", totalScore(id).toString());
  if (score !== null)
  store.teams[id].points = [parseInt(score)];
}

function correct() {
  score(store.settings.answerReward);
}

function newround() {
  store.round++;
  for (const sc of store.teams)
    sc.points.push(0);
}

function saveSettings() {
  var set = JSON.parse(JSON.stringify(store.$state)) as _DeepPartial<State>;
  delete set.teams;
  delete set.settings?.controlled;
  localStorage.setItem('settings', JSON.stringify(set));
}

onMounted(async () => {
  store.view = 1;
  await nextTick();
  store.view = 0;
})

const urlParams = new URLSearchParams(location.search);
if (urlParams.get('controlled') === 'true') {
  store.settings.controlled = true //@ts-ignore
  window['wof_store'] = store.$state; //@ts-ignore
  window['wof_patch'] = store.$patch; //@ts-ignore
  window['wof_update'] = inst?.proxy?.$forceUpdate
}
</script>

<template>
  <va-button v-if="!store.settings.controlled || ctrl" icon="settings" id="settings" @click="settingsModal = true"></va-button>
  <va-modal v-model="settingsModal" :ok-text="t('ui.ok')" :cancel-text="t('ui.cancel')" size="large" max-width="800px" @ok="saveSettings" :blur="true" :title="t('settings.header')">
    <Settings @controlled="settingsModal = false; saveSettings(); ctrl = true"></Settings>
  </va-modal>
  <va-chip v-if="!ctrl" size="large" id="reward">{{ store.reward }}</va-chip>
  <va-tabs v-model="store.view" center style="margin-bottom: 10px;">
    <template #tabs>
      <va-tab v-for="tab in ['wheel', 'word']" :key="tab" style="margin: 0 25px">
        {{ t('ui.' + tab) }}
      </va-tab>
    </template>
  </va-tabs>
  <div v-if="!ctrl" id="points" class="row justify--space-evenly">
    <va-card v-for="(te, i) of store.teams" @contextmenu.prevent="te.points = [0]" @dblclick="setScore(i)" @click="store.current = i" class="flex" :key="te.name + i"
      :color="store.current == i ? 'primary' : 'white'" gradient>
      <va-card-title><p>{{ te.name === '' ? t('game.team', i+1) : te.name }}</p></va-card-title>
      <va-card-content>
        <p>{{ te.points[store.round] ?? 0 }}</p>
        <p style="font-size: 50%; margin-top: 5px;">{{ totalScore(i) }}</p>
      </va-card-content>
    </va-card>
  </div>
  <div v-if="!ctrl" id="content">
    <keep-alive v-if="store.words.length > 0">
      <component :is="store.view == 0 ? Wheel : Word" @points="score" @result="gotResult" @correct="correct" @newround="newround" @vowel="vowel"></component>
    </keep-alive>
    <div v-else id="no-words">
      <h1 class="display-2">{{t('ui.no-words')}}</h1>
    </div>
  </div>
  <Controller v-else></Controller>
</template>

<style lang="scss">
* {
  font-family: var(--va-font-family, 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif');
}

#reward {
  position: fixed;
  top: 20px;
  right: 20px;
}

#settings {
  position: fixed;
  top: 20px;
  left: 20px;
}

#app {
  display: flex;
  flex-direction: column;
  justify-content: stretch;
  height: 100vh;
  max-height: 100vh;
  min-height: 100vh;
  padding: 10px 0;
  background-color: var(--va-background);
  user-select: none;
}

#points {
  text-align: center;
  font-size: 125%;

  .va-card {
    min-width: 150px;
  }

  .va-card__title {
    font-size: 100%;
    padding-bottom: 5px;
    text-align: center;

    p {
      width: 100%;
    }
  }

  .va-card__content {
    font-size: 200%;
  }
}

#content {
  height: 100%;
}

.va-modal__title {
  font-size: 1.25rem !important;
}

#no-words {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  text-align: center;
}
</style>
