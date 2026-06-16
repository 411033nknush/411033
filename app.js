const STORAGE_KEY = 'vocab.words'

// DOM
const card = document.getElementById('card')
const frontEl = document.getElementById('card-front')
const backWord = document.getElementById('back-word')
const backTranslation = document.getElementById('back-translation')
const backPOS = document.getElementById('back-pos')
const backExample = document.getElementById('back-example')
const backEty = document.getElementById('back-etymology')

const btnHome = document.getElementById('btn-home')
const btnManage = document.getElementById('btn-manage')
const viewHome = document.getElementById('view-home')
const viewManage = document.getElementById('view-manage')

const prevBtn = document.getElementById('prev')
const nextBtn = document.getElementById('next')
const randomBtn = document.getElementById('random')

const wordForm = document.getElementById('word-form')
const inputWord = document.getElementById('input-word')
const inputTranslation = document.getElementById('input-translation')
const inputPOS = document.getElementById('input-pos')
const inputExample = document.getElementById('input-example')
const inputEty = document.getElementById('input-etymology')
const btnAutofill = document.getElementById('btn-autofill')
const wordsList = document.getElementById('words-list')

let words = []
let idx = 0

function loadWords(){
  try{words = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || []}catch(e){words=[]}
  if(!Array.isArray(words) || words.length===0){
    words = [
      {word:'serendipity',translation:'意外的美好發現',pos:'noun',example:'A fortunate stroke of serendipity.',etymology:'from Persian Serendip'},
      {word:'concise',translation:'簡潔的',pos:'adjective',example:'Keep your answers concise.',etymology:'from Latin concisus'}
    ]
    saveWords()
  }
}

function saveWords(){localStorage.setItem(STORAGE_KEY,JSON.stringify(words))}

function renderCard(){
  if(words.length===0){frontEl.textContent='（無單字）';backWord.textContent='';backTranslation.textContent='';backPOS.textContent='';backExample.textContent='';backEty.textContent='';return}
  const w = words[idx]
  frontEl.textContent = w.word
  backWord.textContent = w.word
  backTranslation.textContent = w.translation || ''
  backPOS.textContent = w.pos || ''
  backExample.textContent = w.example || ''
  backEty.textContent = w.etymology || ''
}

function showHome(){viewHome.classList.remove('hidden');viewManage.classList.add('hidden')}
function showManage(){viewHome.classList.add('hidden');viewManage.classList.remove('hidden');renderList()}

card.addEventListener('click',()=>{card.classList.toggle('flipped')})
btnHome.addEventListener('click',showHome)
btnManage.addEventListener('click',showManage)

prevBtn.addEventListener('click',()=>{ if(words.length===0) return; idx = (idx-1+words.length)%words.length; card.classList.remove('flipped'); renderCard() })
nextBtn.addEventListener('click',()=>{ if(words.length===0) return; idx = (idx+1)%words.length; card.classList.remove('flipped'); renderCard() })
randomBtn.addEventListener('click',()=>{ if(words.length===0) return; idx = Math.floor(Math.random()*words.length); card.classList.remove('flipped'); renderCard() })

wordForm.addEventListener('submit',(e)=>{
  e.preventDefault()
  const w = inputWord.value.trim()
  if(!w) return
  const entry = {word:w,translation:inputTranslation.value.trim(),pos:inputPOS.value.trim(),example:inputExample.value.trim(),etymology:inputEty.value.trim()}
  words.push(entry)
  saveWords()
  inputWord.value='';inputTranslation.value='';inputPOS.value='';inputExample.value='';inputEty.value=''
  renderList(); alert('已儲存')
})

function renderList(){
  wordsList.innerHTML=''
  words.forEach((w,i)=>{
    const li = document.createElement('li')
    const left = document.createElement('div')
    left.innerHTML = `<strong>${w.word}</strong><div class="word-meta">${w.pos||''} ${w.translation||''}</div>`
    const actions = document.createElement('div')
    actions.className='word-actions'
    const loadBtn = document.createElement('button'); loadBtn.textContent='載入'; loadBtn.onclick=()=>{ idx=i; card.classList.remove('flipped'); renderCard(); showHome() }
    const delBtn = document.createElement('button'); delBtn.textContent='刪除'; delBtn.onclick=()=>{ if(confirm('刪除此單字？')){ words.splice(i,1); saveWords(); renderList(); if(idx>=words.length) idx = Math.max(0,words.length-1); renderCard() } }
    actions.appendChild(loadBtn); actions.appendChild(delBtn)
    li.appendChild(left); li.appendChild(actions)
    wordsList.appendChild(li)
  })
}

// Auto-fill using dictionaryapi.dev and a public translate endpoint
async function autofill(word){
  if(!word) return alert('請輸入英文單字')
  btnAutofill.disabled = true; btnAutofill.textContent='自動填入中…'
  try{
    const dictRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`)
    if(!dictRes.ok) throw new Error('無法取得字典資料')
    const dict = await dictRes.json()
    const first = Array.isArray(dict) && dict[0]
    if(first){
      // part of speech
      const meaning = first.meanings && first.meanings[0]
      const def = meaning && meaning.definitions && meaning.definitions[0]
      inputPOS.value = meaning?.partOfSpeech || inputPOS.value
      inputTranslation.value = def?.definition || inputTranslation.value
      inputExample.value = def?.example || inputExample.value
      inputEty.value = first.origin || inputEty.value
    }

    // translation to zh-TW (best-effort, uses public translate endpoint)
    try{
      const tRes = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh-TW&dt=t&q=${encodeURIComponent(word)}`)
      if(tRes.ok){
        const tjson = await tRes.json()
        const translated = Array.isArray(tjson) && tjson[0] && tjson[0][0] && tjson[0][0][0]
        if(translated) inputTranslation.value = translated
      }
    }catch(e){/* ignore translate error */}

  }catch(err){
    alert('自動填入發生錯誤：'+err.message)
  }finally{ btnAutofill.disabled=false; btnAutofill.textContent='自動填入' }
}

btnAutofill.addEventListener('click',()=>autofill(inputWord.value.trim()))

// init
loadWords(); renderCard(); renderList();
