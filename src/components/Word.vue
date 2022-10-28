<script setup lang="ts">
import { computed, getCurrentInstance, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import useStore from '../store';
import type { Word, Tile, Letter } from '../store';
import { storeToRefs } from 'pinia';

const emit = defineEmits<{
    (e: 'points'): void,
    (e: 'correct'): void,
    (e: 'newround'): void,
    (e: 'vowel'): void
}>()
const { t } = useI18n()
const store = useStore();
const sound = ref(null);
const audio = new Audio();
const inst = getCurrentInstance();
audio.autoplay = true;
var avWords: typeof store.words = JSON.parse(JSON.stringify(store.words));

function setLetters() {
    store.letters = [];
    store.settings.charset.split('').forEach(letter => {
        store.letters.push({
            letter,
            used: false,
            vowel: store.settings.vowels.includes(letter)
        });
    });
    for (const t of store.tiles) {
        if (!t.correct)
            t.visible = !(store.settings.charset.includes(t.letter))
    }
    updateControlled();
}
setLetters();
watch(store.settings, (nval, oval) => {
    if (nval.charset != oval.charset || nval.vowels != oval.vowels)
        setLetters();
}, { deep: true });

function getRandomElement(array: any[]) {
    const ind = Math.floor(Math.random() * array.length);
    return array.splice(ind, 1)[0];
}

function reveal(tile: Tile) {
    if (tile.correct) {
        audio.src = '/sounds/letter.mp3';
        tile.visible = true;
        if (!(tile.vowel && store.settings.buyVowels))
            emit('points');
        updateControlled();
    }
}

function showLetters(letter: Letter) {
    if (letter.vowel && store.settings.buyVowels)
        emit('vowel');
    var any = false;
    for (const tile of store.tiles) {
        if (tile.letter === letter.letter) {
            tile.correct = true;
            any = true;
            console.log(tile);
        }
    }
    audio.src = `/sounds/${any ? 'correct' : 'wrong'}_letter.wav`;
    store.letters.find(x => x.letter === letter.letter)!.used = true;
    updateControlled();
}

function show(correct = false) {
    for (const tile of store.tiles) {
        tile.visible = true;
    }
    if (correct) {
        emit('correct');
        audio.src = '/sounds/correct_word.wav';
    }
    updateControlled();
}

function getWord(first = false) {
    if (store.words.length == 0)
        return;
    if (avWords.length == 0)
        avWords = JSON.parse(JSON.stringify(store.words));
    store.word = getRandomElement(avWords);
    console.log(store.word.word);
    store.tiles = [];
    store.word.word?.toUpperCase().split('').map((letter, i) => {
        store.tiles.push({
            letter: letter,
            correct: false,
            visible: !(store.settings.charset.includes(letter)),
            vowel: store.settings.vowels.includes(letter)
        });
    });
    for (const letter of store.letters) {
        letter.used = false;
    }
    updateControlled();
    if (!first)
        emit('newround');
}

getWord(true);

function updateControlled() {
    if (store.settings.controlled) { //@ts-ignore
        window['wof_show'] = show; //@ts-ignore
        window['wof_reveal'] = reveal; //@ts-ignore
        window['wof_revealAll'] = () => {
            for (const tile of store.tiles) {
                if (!tile.visible && tile.correct)
                    reveal(tile);
            }
        } //@ts-ignore
        window['wof_getWord'] = getWord; //@ts-ignore
        window['wof_showLetters'] = showLetters; //@ts-ignore
        window['wof_update_word'] = inst?.proxy?.$forceUpdate
    }
}

updateControlled();
</script>

<template>
    <div id="word">
        <h2 class="display-2">Kategoria: {{ store.word.category }}</h2>
        <div id="tiles">
            <div id="tiles-container">
                <va-card @click="reveal(t)" v-for="t in store.tiles"
                    :color="t.letter == ' ' || t.visible ? 'white' : (t.correct ? 'success' : 'primary')" gradient>
                    <va-card-content>{{ t.visible ? (t.letter == ' ' ? '&nbsp;' : t.letter) : '&nbsp;' }}
                    </va-card-content>
                </va-card>
            </div>
        </div>
        <div id="letters">
            <va-card @click="showLetters(l)" v-for="l in store.letters" :disabled="l.used" gradient
                :color="l.vowel && store.settings.buyVowels ? 'focus' : 'white'">
                <va-card-content>{{ l.letter }}</va-card-content>
            </va-card>
            <va-card @click="getWord()" gradient>
                <va-card-content>
                    <va-icon style="margin-left: -75%" name="refresh"></va-icon>
                </va-card-content>
            </va-card>
            <va-card @click="show()" gradient>
                <va-card-content>
                    <va-icon style="margin-left: -75%" name="visibility"></va-icon>
                </va-card-content>
            </va-card>
            <va-card @click="show(true)" gradient>
                <va-card-content>
                    <va-icon style="margin-left: -75%" name="add"></va-icon>
                </va-card-content>
            </va-card>
        </div>
    </div>
</template>

<style lang="scss">
#word {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;

    h2 {
        margin-top: 20px;
    }
}

#tiles {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    margin: 10px auto;
    max-width: 90%;
    flex-grow: 1;

    #tiles-container {
        display: flex;
        flex-direction: row;
        justify-content: center;
        gap: 10px;
        align-items: center;
        flex-wrap: wrap;
    }

    .va-card {
        height: 72px;
        width: 72px;
    }

    .va-card__content {
        font-size: 200%;
        text-align: center;
    }
}

#letters {
    display: flex;
    flex-direction: row;
    justify-content: center;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
    margin: 10px auto;

    .va-card {
        height: 60px;
        width: 50px;
    }

    .va-card__content {
        font-size: 125%;
        text-align: center;
    }
}
</style>