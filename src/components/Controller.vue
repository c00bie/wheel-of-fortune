<script setup lang="ts">
import { computed, getCurrentInstance, inject, reactive, Ref, ref, unref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import useStore, { Letter } from '../store';

interface Data {
  [key: string]: any;
}

const app = document.getElementById('app');
if (app) {
  app.style.maxHeight = 'unset';
  app.style.height = 'max-content';
}

const store = useStore();
const { t } = useI18n()
const win = ref<Window | null>(null);
const data = reactive<Data>({});
const settingsOpen = inject('settingsOpen') as Ref<boolean>;
const lett = ref<Letter[]>([]);
var updating = false;
var pauseUpdate = false;

function pause(timeout: number = 1000) {
  pauseUpdate = true;
  setTimeout(() => pauseUpdate = false, timeout);
}

function openWindow() {
  win.value = window.open(location.href + '?controlled=true', '_blank')
  updateData();
}
openWindow();

function setTab(val: 0 | 1) {
  store.view = val
}

watch(store, (nval, oval) => {
  if (updating || pauseUpdate) return;
  var st = JSON.parse(JSON.stringify(store.$state));
  delete st.letters;
  st.settings.controlled = true;
  data.patch?.(st);
  data.update?.();
  data.update_wheel?.();
  data.update_word?.();
  if (nval.wheel.values != oval.wheel.values)
    data.draw?.();
}, { deep: true });

store.wheel.valueUpdate = () => {
  data.draw?.();
}

function updateData() {
  try {
    if (settingsOpen.value) return;
    updating = true;
    if (win.value && !win.value.closed) {
      for (const k in win.value) {
        if (k.startsWith('wof_')) {
          data[k.substring(4)] = win.value[k];
        }
      }
      if (data.store) {
        var st = JSON.parse(JSON.stringify(data.store));
        delete st.settings.controlled;
        delete st.wheel.valueUpdate;
        store.$patch(st);
        if (lett.value.length == 0) {
          lett.value = JSON.parse(JSON.stringify(store.letters));
        }
      }
    }
    else win.value = null;
  }
  catch (e) { }
  finally {
    updating = false;
  }
}
setInterval(updateData, 100);

function showLetter(l: Letter) {
  setTab(1);
  setTimeout(() => {
    data.showLetters?.(l);
  }, 100)
}
</script>

<template>
  <div id="controller">
    <va-card style="grid-column: 1 / 3;">
      <va-card-content>
        <h2>{{t('controller.category')}}:</h2>
        <p class="display-4">{{ store.word?.category ?? t('controller.unknown') }}</p>
        <h2>{{t('controller.word')}}:</h2>
        <p class="display-3">{{ store.word?.word ?? t('controller.unknown') }}</p>
      </va-card-content>
    </va-card>
    <va-card>
      <va-card-content style="display: grid; grid-template-rows: min-content 1fr min-content; height: 100%;">
        <h2>{{t('controller.reward')}}:</h2>
        <p class="display-1" style="place-self: center; text-align: center;">{{ store.reward ?? t('controller.unknown') }}</p>
        <va-button size="small" @click="data.spin?.(); setTab(0);">{{t('controller.spin')}}</va-button>
      </va-card-content>
    </va-card>
    <va-card>
      <va-card-content
        style="display: flex; flex-direction: column; justify-content: space-evenly; gap: 10px; height: 100%;">
        <h2>{{t('controller.round')}}:</h2>
        <p class="display-4" style="white-space: nowrap;">{{ t('controller.current_round', (store.round ?? 0)+1) }}</p>
        <va-button size="small" @click="setTab(1); data.show?.()">{{t('controller.reveal')}}</va-button>
        <va-button size="small" @click="setTab(1); data.show?.(true)">{{t('controller.correct')}}</va-button>
        <va-button size="small" @click="setTab(1); data.getWord?.()">{{t('controller.next_round')}}</va-button>
      </va-card-content>
    </va-card>
    <va-card style="grid-column: 2 / 4;">
      <va-card-content>
        <h2>{{t('controller.scores')}}:</h2>
        <div id="scores">
          <table class="va-table">
            <thead>
              <tr>
                <th></th>
                <th>{{t('controller.id')}}</th>
                <th>{{t('controller.team_name')}}</th>
                <th v-for="i in (store.round ?? -1)+1" :key="i">{{t('controller.round_n', i)}}</th>
                <th>{{t('controller.sum')}}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(team, i) in store.teams" :key="i">
                <td><input type="radio" name="teamselect" :value="i" v-model="store.current"></td>
                <td>{{i+1}}</td>
                <td>{{team.name === '' ? t('controller.team', i+1) : team.name}}</td>
                <td v-for="j in (store.round ?? -1)+1" :key="j">{{team.points[j-1] ?? 0}}</td>
                <td>{{team.points.reduce((sum, curr) => sum + curr, 0)}}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </va-card-content>
    </va-card>
    <va-card id="tiles-card" style="grid-column: 1 / 3">
      <va-card-content>
        <div id="tiles-container" v-if="store.tiles">
          <va-card @click="setTab(1); data.reveal?.(t)" v-for="(t, i) of store.tiles" :key="i"
            :color="t.letter == ' ' || t.visible ? 'white' : (t.correct ? 'success' : 'primary')" gradient>
            <va-card-content>{{ t.visible ? (t.letter == ' ' ? '&nbsp;' : t.letter) : '&nbsp;' }}
            </va-card-content>
          </va-card>
        </div>
      </va-card-content>
    </va-card>
    <va-card>
      <va-card-content style="display: flex; flex-direction: row; justify-content: center; flex-wrap: wrap; gap: 10px; height: 100%;">
          <va-card @click="showLetter(t)" v-for="(t, i) of store.letters" :key="i"
            :color="t.vowel && store.settings.buyVowels ? 'warning' : 'white'" :disabled="t.used" gradient>
            <va-card-content style="padding: 5px">{{ t.letter }}</va-card-content>
          </va-card>
      </va-card-content>
    </va-card>
  </div>
</template>

<style lang="scss">
#controller {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-template-rows: repeat(4, minmax(0, min-content));
  gap: 20px;
  align-items: stretch;
  justify-content: center;
  height: 100%;
  width: 90%;
  max-width: 1000px;
  padding: 1rem;
  box-sizing: border-box;
  margin: 50px auto;

  > .va-card {
    min-width: 0;
  }

  #tiles-container {
    display: flex;
    flex-direction: row;
    justify-content: center;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;

    .va-card {
      height: 36px;
      width: 36px;
    }

    .va-card__content {
      font-size: 100%;
      text-align: center;
      padding: 25% !important;
    }
  }
}

#tiles-card {
  .va-card__content {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
}

#scores {
  overflow: auto;
  height: 100%;
  max-height: 200px;

  table {

    th,
    td {
      text-align: center;
      white-space: nowrap;
    }
  }
}
</style>