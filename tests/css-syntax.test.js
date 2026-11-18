import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';

// Une parenthèse non fermée (ex. `width:min(720px,calc(100vw - 16px);`) fait ignorer par le navigateur
// TOUT le reste de la feuille, sans aucune erreur visible : ce garde-fou bloque la CI avant publication.
const root=new URL('../',import.meta.url);
const sheets=readdirSync(root).filter(f=>f.endsWith('.css'));

function balance(css){
 const text=css.replace(/\/\*[\s\S]*?\*\//g,'').replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g,'""');
 let paren=0,brace=0;
 for(const [i,ch] of [...text].entries()){
  if(ch==='(')paren++;else if(ch===')')paren--;
  else if(ch==='{')brace++;else if(ch==='}')brace--;
  if(paren<0||brace<0)return {paren,brace,at:text.slice(Math.max(0,i-60),i+1)};
  if(ch==='}'&&paren!==0)return {paren,brace,at:text.slice(Math.max(0,i-80),i+1)};
 }
 return {paren,brace,at:null};
}

test('CSS : chaque feuille a des parenthèses et accolades équilibrées (sinon la suite est ignorée)',()=>{
 assert.ok(sheets.length>=4,'feuilles trouvées : '+sheets.join(', '));
 for(const file of sheets){
  const {paren,brace,at}=balance(readFileSync(new URL(file,root),'utf8'));
  assert.equal(at,null,file+' : parenthèse ou accolade non fermée près de « '+at+' »');
  assert.equal(paren,0,file+' : parenthèses déséquilibrées');
  assert.equal(brace,0,file+' : accolades déséquilibrées');
 }
});
