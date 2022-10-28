import { defineStore } from 'pinia'

export interface Wheel {
  values: Array<string | number | null>,
  valueUpdate?: () => void
}

export interface Tile {
  letter: string,
  correct: boolean,
  visible: boolean,
  vowel: boolean
}

export interface Letter {
  letter: string,
  used: boolean,
  vowel: boolean,
}

export interface Team {
  name: string
  points: number[]
}

export interface Word {
  word: string
  category: string
}

export interface Settings {
  teamCount: number,
  buyVowels: boolean,
  bankruptPerRound: boolean,
  wheel: {
    spinMin: number,
    spinMax: number,
    useRandomOrg: boolean,
  },
  language: string,
  charset: string,
  vowels: string,
  vowelPrice: number,
  answerReward: number,
  controlled: boolean,
}

export interface State {
  wheel: Wheel,
  teams: Team[],
  words: Word[],
  letters: Letter[],
  tiles: Tile[],
  word: Partial<Word>,
  view: 0 | 1,
  current: number,
  reward: number | string,
  round: number,
  settings: Settings,
}

const mainStore = defineStore('main', {
  state: (): State => {
    return { 
      wheel: {
        values: [],
        valueUpdate: undefined,
      },
      teams: [],
      words: [],
      letters: [],
      tiles: [],
      word: {},
      view: 0,
      current: 0,
      reward: 0,
      round: 0,
      settings: {
        teamCount: 3,
        buyVowels: true,
        bankruptPerRound: true,
        wheel: {
          spinMin: 3000,
          spinMax: 6000,
          useRandomOrg: false,
        },
        language: navigator.language.substring(0, 2),
        charset: '',
        vowels: '',
        vowelPrice: 200,
        answerReward: 1000,
        controlled: false
      },
    }
  },
  getters: {
    scores: (state: State) => {
      return state.teams.map(team => team.points)
    },
    teamCount: (state: State) => {
      return state.teams.length
    }
  },
  actions: {
    setTeamCount(count: number) {
      this.teams = this.teams.slice(0, count)
      for (let i = this.teams.length; i < count; i++) {
        this.teams.push({
          name: '',
          points: []
        })
      }
      this.settings.teamCount = count
    }
  }
})

export default mainStore