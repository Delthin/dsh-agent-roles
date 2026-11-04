import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

const source=await readFile(new URL('./client.js',import.meta.url),'utf8');
const role={id:'test',name:'test',displayName:'测试角色',description:'职责',prompt:'任务',enabled:true,provider:'test',model:'same-model',reasoningEffort:'',tools:[]};
function panel(draft=role,fastProviders=['test']) {
  const state=[{revision:1,roles:[draft]},[{provider:'test',id:'same-model'}],[],draft,JSON.stringify(draft),{},false,'','','roles','config','','',[],null,null,[],'','',false,fastProviders];
  let cursor=0,entry,module,request;
  const h=(type,props,...children)=>({type,props:props??{},children:children.flat(Infinity)});
  const primitives=Object.fromEntries(['Button','Switch','Checkbox','SegmentedControl','Modal'].map(name=>[name,()=>{}]));
  const React={createElement:h,useState(initial){const i=cursor++;if(!(i in state))state[i]=initial;return [state[i],value=>{state[i]=typeof value==='function'?value(state[i]):value;}];},useEffect(){}};
  runInNewContext(source,{document:{createElement:()=>({dataset:{},remove(){}}),head:{appendChild(){}}},window:{__ModuleLoader__:{load(value){module=value.factory(name=>name==='react'?React:primitives);}}},crypto:{randomUUID:()=> 'new-role'},fetch:async(_url,options)=>{request=JSON.parse(options.body);return {ok:true,json:async()=>({catalog:{revision:2,roles:[request.role]}})};}});
  module.apply({effect(){},slots:{inject(_key,fn){fn();},register(options,render){if(options.key==='agent-roles')entry=render();}},uiWorkspace:{}});
  return {state,primitives,render(){cursor=0;return entry.type(entry.props);},get request(){return request;}};
}
function nodes(tree) {return !tree||typeof tree!=='object'?[]:[tree,...tree.children.flatMap(nodes)];}
function text(tree) {return !tree||typeof tree==='boolean'?'':typeof tree!=='object'?String(tree):tree.children.map(text).join(' ');}

test('现有模型配置使用 Fast Switch，缺省关闭并保存布尔值；新增角色也是关闭',async()=>{
  const app=panel();
  let tree=app.render(),toggle=nodes(tree).find(n=>n.type===app.primitives.Switch&&n.props.label==='Fast');
  assert.ok(toggle);assert.equal(toggle.props.checked,false);assert.equal(toggle.props.disabled,false);
  assert.match(text(tree),/新成员启动时固定/);
  toggle.props.onChange(true);
  tree=app.render();toggle=nodes(tree).find(n=>n.type===app.primitives.Switch&&n.props.label==='Fast');
  assert.equal(toggle.props.checked,true);
  nodes(tree).find(n=>n.type==='form').props.onSubmit({preventDefault(){}});
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(app.request.action,'save');assert.equal(app.request.role.fast,true);
  tree=app.render();
  nodes(tree).find(n=>n.type===app.primitives.Button&&n.children.includes('新增角色')).props.onClick();
  assert.equal(app.state[3].fast,false);
});

test('不支持供应商禁止开启 Fast，但已有 Fast 可关闭；支持清单完全来自模型目录',()=>{
  const unsupported=panel(role,['cpa']);
  let tree=unsupported.render(),toggle=nodes(tree).find(n=>n.type===unsupported.primitives.Switch&&n.props.label==='Fast');
  assert.equal(toggle.props.disabled,true);assert.match(text(tree),/当前供应商不支持 Fast/);
  toggle.props.onChange(true);assert.equal(unsupported.state[3].fast,undefined);
  const existing=panel({...role,fast:true},['cpa']);
  tree=existing.render();toggle=nodes(tree).find(n=>n.type===existing.primitives.Switch&&n.props.label==='Fast');
  assert.equal(toggle.props.disabled,false);toggle.props.onChange(false);
  tree=existing.render();toggle=nodes(tree).find(n=>n.type===existing.primitives.Switch&&n.props.label==='Fast');
  assert.equal(toggle.props.checked,false);assert.equal(toggle.props.disabled,true);
  const loading=panel(role,[]);
  assert.equal(nodes(loading.render()).find(n=>n.type===loading.primitives.Switch&&n.props.label==='Fast'),undefined);
});

test('运行列表显示选择快照 Fast 或标准，而不读取当前角色 Fast',()=>{
  const app=panel();app.state[9]='runs';
  app.state[13]=[
    {sessionId:'standard',memberName:'standard',role:{...role,fast:true},selection:{fast:false},audit:{},createdAt:'2026-01-01T00:00:00Z',status:'inactive'},
    {sessionId:'fast',memberName:'fast',role:{...role,fast:false},selection:{fast:true},audit:{},createdAt:'2026-01-01T00:00:00Z',status:'inactive'},
    {sessionId:'old',memberName:'old',role:{...role,fast:true},audit:{},createdAt:'2026-01-01T00:00:00Z',status:'inactive'},
  ];
  const articles=nodes(app.render()).filter(n=>n.type==='article');
  assert.match(text(articles[0]),/same-model · 标准/);
  assert.match(text(articles[1]),/same-model · Fast/);
  assert.match(text(articles[2]),/same-model · 标准/);
});
