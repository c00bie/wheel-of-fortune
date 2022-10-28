<script setup lang="ts">
import { _DeepPartial } from 'pinia';
import { computed, inject, Ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { VaFile } from 'vuestic-ui';
import useStore, { State } from '../store';

const emit = defineEmits<{
  (e: 'controlled'): void
}>()

const store = useStore();
const { t } = useI18n();
const spinTime = computed({
  get: () => [store.settings.wheel.spinMin, store.settings.wheel.spinMax],
  set: (val: number[]) => {
    store.settings.wheel.spinMin = val[0];
    store.settings.wheel.spinMax = val[1];
  }
})

function reset() {
  localStorage.removeItem('settings');
  location.reload();
}

function save(game: boolean) {
  var set = JSON.parse(JSON.stringify(store.$state)) as _DeepPartial<State>;
  if (!game) {
    delete set.teams;
    delete set.settings?.teamCount;
    delete set.settings?.controlled;
  }
  downloadJson(set, `wof-${game ? 'game' : 'settings'}.json`);
}

function downloadJson(obj: any, name: string){
  var dwn = document.createElement('a');
  dwn.setAttribute("href", "data:application/json;charset=utf-8," + encodeURIComponent(JSON.stringify(obj)));
  dwn.setAttribute("download", name + (name.endsWith('.json') ? '' : '.json'));
  document.body.appendChild(dwn);
  dwn.click();
  dwn.remove();
}

function load(file: VaFile[]) {
  file[0].text?.().then((txt) => {
    var json = JSON.parse(txt);
    store.$patch(json);
  })
}

function startControlled() {
  emit('controlled')
}

function valueUpdate() {
  store.wheel.valueUpdate?.();
}
</script>

<template>
  <div class="row justify--space-between mb-3 align--center">
    <h2>{{t('settings.teams')}}</h2>
    <va-button flat icon="add" @click="store.setTeamCount(store.settings.teamCount + 1)"></va-button>
  </div>
  <div class="scroller">
    <div v-for="(w, i) in store.teams" class="scroller-item">
      <va-input :label="t('settings.name')" v-model="w.name" style="flex-grow: 1"></va-input>
      <va-button flat icon="remove" @click="store.teams.splice(i, 1); store.settings.teamCount--"></va-button>
    </div>
  </div>
  <div class="row justify--space-between my-3 align--center">
    <h2>{{t('settings.words')}}</h2>
    <va-button flat icon="add" @click="store.words.push({word: '', category: ''})"></va-button>
  </div>
  <div class="scroller">
    <div v-for="(w, i) in store.words" class="scroller-item">
      <va-input :label="t('settings.word')" v-model="w.word"></va-input>
      <va-input :label="t('settings.category')" v-model="w.category"></va-input>
      <va-button flat icon="remove" @click="store.words.splice(i, 1)"></va-button>
    </div>
  </div>
  <div class="row justify--space-between my-3 align--center">
    <h2>{{t('settings.wheel_values')}}</h2>
    <va-button flat icon="add" @click="store.wheel.values.push('')"></va-button>
  </div>
  <div class="scroller">
    <div v-for="(v, i) in store.wheel.values" class="scroller-item">
      <va-input :label="t('settings.value')" v-model="store.wheel.values[i]" style="flex-grow: 1"
        :disabled="v === null" @blur="valueUpdate"></va-input>
      <va-checkbox :label="t('settings.is_bankrupt')" v-model="store.wheel.values[i]" @blur="valueUpdate" @mouseup="valueUpdate" :true-value="null"
        :false-value="''"></va-checkbox>
      <va-button flat icon="remove" @click="store.wheel.values.splice(i, 1)"></va-button>
    </div>
  </div>
  <h2 class="my-3">{{t('settings.spin_time')}}</h2>
  <va-slider class="mx-2" v-model="spinTime" range :min="1000" :max="10000" :step="250" track-label-visible pins>
  </va-slider>
  <h2 class="my-3">{{t('settings.misc')}}</h2>
  <div id="misc" class="row">
    <div class="flex sm6">
      <va-switch v-model="store.settings.buyVowels" size="small">
        <p class="ml-2">{{t('settings.buy_vowels')}}</p>
      </va-switch>
      <va-counter :label="t('settings.vowel_price')" manual-input :min="0" :step="10"
        v-model="store.settings.vowelPrice"></va-counter>
    </div>
    <div class="flex sm6">
      <va-switch v-model="store.settings.bankruptPerRound" size="small">
        <p class="ml-2" style="line-height: initial">{{t('settings.bakrupt_per_round')}}</p>
      </va-switch>
      <va-switch v-model="store.settings.wheel.useRandomOrg" size="small">
        <p class="ml-2" style="line-height: initial">{{t('settings.use_random_org')}}</p>
      </va-switch>
      <va-counter :label="t('settings.answer_reward')" manual-input :min="0" :step="10"
        v-model="store.settings.answerReward"></va-counter>
    </div>
  </div>
  <h2 class="my-3">{{t('settings.save_load')}}</h2>
  <div class="row justify--space-between">
    <va-button @click="save(true)">{{t('settings.save_game')}}</va-button>
    <va-button @click="save(false)">{{t('settings.save_settings')}}</va-button>
    <va-file-upload type="single" :hide-file-list="true" file-types="application/json" style="margin: 0" @file-added="load">
      <va-button>{{t('settings.load')}}</va-button>  
    </va-file-upload>
    <va-button color="danger" @click="reset">{{t('settings.reset')}}</va-button>
  </div>
  <p class="text--secondary mt-3">{{t('settings.save_local')}}</p>
  <va-button v-if="!store.settings.controlled" class="mt-3" @click="startControlled">{{t('settings.start_controlled')}}</va-button>
</template>

<style lang="scss">
.scroller {
  overflow-y: scroll;
  height: 100%;
  max-height: 300px;
  min-width: 500px;
  margin-bottom: 50px;

  .scroller-item {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 10px;
    margin: 20px 5px;

    .va-input-wrapper {
      flex-grow: 1;
    }

    &:first-child {
      margin-top: 0;
    }

    &:last-child {
      margin-bottom: 0;
    }
  }
}

#misc {

  > .flex {
    display: flex;
    flex-direction: column;
    justify-content: stretch;
    gap: 15px;
    padding: 10px;

    > * {
      flex-grow: 1;
    width: 100% !important;
    }
  }
}
</style>