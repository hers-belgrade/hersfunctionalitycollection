var errors = {
  OK:{},
  NO_FUNCTIONALITY_NAME:{message:'No functionality name provided'},
  NO_INSTANCE_NAME:{message:'No instance name provided for instantiation'},
  NO_PARAM_OBJ:{message:'No parameters provided for instantiation'},
  INSTANCE_ALREADY_EXISTS:{message:'Instance [instancename] already exists',params:['instancename']}
};

var spawn = function(paramobj,statuscb){
  if(!paramobj){
    return statuscb('NO_PARAM_OBJ');
  }
  if(!paramobj.name){
    return statuscb('NO_INSTANCE_NAME');
  }
  var instname = paramobj.name;
  if(!this.self.functionalityname){
    return statuscb('NO_FUNCTIONALITY_NAME');
  }
  var felem = this.data.element([instname]);
  if(felem){
    return statuscb('INSTANCE_ALREADY_EXISTS',instname);
  }
  //observe the doubt about the keys:
  //should the keys for locking the fresh new instance and the 
  //functionality attached to it be the same?
  //or distinct? 
  //for now, let it be "the same key", paramobj.key
  this.data.commit('new_instance',[
  ['set',[instname],paramobj.key]
  ]);
  var felem = this.data.element([instname]);
  felem.attach(this.self.functionalityname,paramobj,paramobj.key,null,this.consumeritf);
  statuscb('OK');
};
spawn.params = 'originalobj';

var init = function(statuscb){
  if(!this.self.functionalityname){
    return statuscb('NO_FUNCTIONALITY_NAME');
  }
};

module.exports = {
  errors:errors,
  init:init,
  spawn:spawn
};
