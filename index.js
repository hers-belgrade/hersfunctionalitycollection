var errors = {
  OK:{},
  NO_FUNCTIONALITY_NAME:{message:'No functionality name provided'},
  NO_TEMPLATE_NAME:{message:'No template name provided for storing'},
  INVALID_TEMPLATE_NAME:{message:'Template name [templatename] is invalid',params:['templatename']},
  NO_INSTANCE_NAME:{message:'No instance name provided for instantiation'},
  NO_PARAM_OBJ:{message:'No parameters provided for instantiation'},
  INSTANCE_ALREADY_EXISTS:{message:'Instance [instancename] already exists',params:['instancename']}
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
  var felem = target.element([instname]);
  if(felem){
    return statuscb('INSTANCE_ALREADY_EXISTS',instname);
  }
  //observe the doubt about the keys:
  //should the keys for locking the fresh new instance and the 
  //functionality attached to it be the same?
  //or distinct? 
  //for now, let it be "the same key", paramobj.key
  target.commit('new_instance',[
  ['set',[instname],paramobj.key]
  ]);
  var felem = target.element([instname]);
  felem.attach(this.self.functionalityname,paramobj,paramobj.key,null,this.consumeritf);
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
  so.name = paramobj.template+so.name;
  for(var i in paramobj){
    if(i!=='templatename'){
      so[i] = paramobj[i];
    }
  }
  so.name = paramobj.templatename+so.name;
  return spawn.call(this,so,statuscb);
};
spawnTemplate.params = 'originalobj';

var init = function(statuscb){
  if(!this.self.functionalityname){
    return statuscb('NO_FUNCTIONALITY_NAME');
  }
  this.self.templates = {};
};

module.exports = {
  errors:errors,
  init:init,
  spawn:spawn,
  storeTemplate:storeTemplate,
  spawnTemplate:spawnTemplate
};
