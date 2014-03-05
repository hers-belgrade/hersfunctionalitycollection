var Timeout = require('herstimeout');
var errors = {
  OK:{},
  NO_FUNCTIONALITY_NAME:{message:'No functionality name provided'},
  NO_TEMPLATE_NAME:{message:'No template name provided for storing'},
  INVALID_TEMPLATE_NAME:{message:'Template name [templatename] is invalid',params:['templatename']},
  NO_INSTANCE_NAME:{message:'No instance name provided for instantiation'},
  NO_PARAM_OBJ:{message:'No parameters provided for instantiation'},
  INSTANCE_ALREADY_EXISTS:{message:'Instance [instancename] already exists',params:['instancename']},
  INSTANCE_DOESNT_EXIST:{message:'Instance [instancename] does not exist',params:['instancename']}
};

var spawn = function(paramobj,statuscb){
  if(!paramobj){
    return statuscb('NO_PARAM_OBJ');
  }
  if(typeof paramobj.name === 'undefined'){
    return statuscb('NO_INSTANCE_NAME');
  }
  var instname = paramobj.name;
  if(!this.self.functionalityname){
    return statuscb('NO_FUNCTIONALITY_NAME');
  }
  var target = this.self.target ? this.self.target : this.data;
  var consumeritf = this.self.consumeritf || this.consumeritf;
  var felem = target.element([instname]);
  if(!felem){
    //observe the doubt about the keys:
    //should the keys for locking the fresh new instance and the 
    //functionality attached to it be the same?
    //or distinct? 
    //for now, let it be "the same key", paramobj.key
    target.commit('new_instance',[
    ['set',[instname],paramobj.key],
    ['set',[instname,'_functionality'],[this.self.functionalityname,undefined,'dcp']]
    ]);
    felem = target.element([instname]);
  }
  if(felem.functionalities && felem.functionalities[this.self.functionalityname]){
    return statuscb('INSTANCE_ALREADY_EXISTS',instname);
  }
  var key = paramobj.key;
  delete paramobj.key;
  var environment = paramobj.environment||this.self.environment;
  var eg = environment.gone;
  environment.gone = function(){
    if(typeof eg === 'function'){
      eg.apply(this,arguments);
    }
    Timeout.set(function(target,instname){
      target.commit('instance_down',[
        ['remove',[instname]]
      ]);
    },1000,target,this.self.name);
  };
  delete paramobj.environment;
  //console.log('functionalitycollection attaching',this.self.functionalityname);
  felem.attach(this.self.functionalityname,paramobj,key,environment,consumeritf);
  this.cbs.instanceUp(felem);//paramobj.templatename,paramobj.name);
  //felem.attach(this.self.functionalityname,paramobj,paramobj.key,null,this.consumeritf);
  statuscb('OK');
};
spawn.params = 'originalobj';

var storeTemplate = function(paramobj,statuscb){
  if(!paramobj){
    return statuscb('NO_PARAM_OBJ');
  }
  if(!paramobj.name){
    return statuscb('NO_TEMPLATE_NAME');
  }
  var to = this.self.templates[paramobj.name];
  var found = true;
  if(!to){
    found = false;
    to = {};
  }
  for(var i in paramobj){
    if(i!=='name'){
      to[i] = paramobj[i];
    }
  }
  if(!found){
    this.self.templates[paramobj.name] = to;
  }
  statuscb('OK');
};
storeTemplate.params = 'originalobj';

var spawnTemplate = function(paramobj,statuscb){
  if(!paramobj){
    return statuscb('NO_PARAM_OBJ');
  }
  if(typeof paramobj.name === 'undefined'){
    return statuscb('NO_INSTANCE_NAME');
  }
  if(!paramobj.templatename){
    return statuscb('NO_TEMPLATE_NAME');
  }
  var to = this.self.templates[paramobj.templatename];
  if(!to){
    return statuscb('INVALID_TEMPLATE_NAME',paramobj.templatename);
  }
  var so = {};
  for(var i in to){
    so[i] = to[i];
  }
  for(var i in paramobj){
    //if(i!=='templatename'){ //do pass the templatename for spawn, yes...
      so[i] = paramobj[i];
    //}
  }
  so.name = paramobj.templatename+so.name;
  return spawn.call(this,so,statuscb);
};
spawnTemplate.params = 'originalobj';

function removeTemplateInstance(instancename,statuscb){
  var target = this.self.target ? this.self.target : this.data;
  var felem = target.element([instancename]);
  if(!felem){
    return statuscb('INSTANCE_DOESNT_EXIST',instancename);
  }
  target.commit('instance_down',[
    ['remove',[instancename]]
  ]);
  statuscb('OK');
};
removeTemplateInstance.params = ['instancename'];

var init = function(statuscb){
  if(!this.self.functionalityname){
    return statuscb('NO_FUNCTIONALITY_NAME');
  }
  this.self.templates = {};
  var target = this.self.target ? this.self.target : this.data;
  var t = this;
  target.waitFor(['Collection:*',['_functionality','name']],function(roomname,map){
    var fn = map._functionality;
    //console.log(roomname,map);
    if(fn===t.self.functionalityname){
      var el = target.element([roomname]);
      if(el.functionalities && el.functionalities[fn]){
        return;
      }
      Timeout.set(function(t,fn,el){
        try{
          if(!el.element){
            //this el is destroyed
            return;
          }
          if(el.functionalities && el.functionalities[fn]){
            return;
          }
          //console.log('attaching',name);
          el.attach(fn,{},t.self.key,t.self.environment);
          t.cbs.instanceUp(el);//.element(['templatename']).value(),name);
          return;
        }
        catch(e){
          console.log(e.stack);
          console.log(e);
        }
      },1000,t,fn,el);
    }
  });
};

module.exports = {
  errors:errors,
  init:init,
  spawn:spawn,
  storeTemplate:storeTemplate,
  spawnTemplate:spawnTemplate,
  removeTemplateInstance:removeTemplateInstance,
  requirements:{
    instanceUp:function(instance){
      //console.log('still noone handling',instance);
    }
  }
};
