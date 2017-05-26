'use strict';

const utils = require('./utils');

module.exports = function(options,client, synchronizer){

  this.pre('save',function(next) {
      console.log("Item Pre Save Trigger");
    let isModified = false;

    let relevantKeys = utils.GetRelevantKeys(this.toJSON(), options.selector);
    if(relevantKeys && relevantKeys.length) {
      relevantKeys.forEach(key => {
        if(this.isModified(key)) isModified = true;
      });
    }else{
      if(this.isModified()) isModified = true;
    }

    this.wasNew = this.isNew;
    this.wasModified = isModified;
    next();
  });

  this.post('save',function() {
      console.log("Item Post Save Trigger");
    let indices = utils.GetIndexName(this,options.indexName);
    if(indices instanceof Array) {
      indices.forEach(index => synchronizer.SyncItem(this, client.initIndex(index)));
    }else{
        synchronizer.SyncItem(this, client.initIndex(indices));
    }
  });

  this.post('remove',function(){
      console.log("Item Remove Trigger");
    let indices = utils.GetIndexName(this,options.indexName);
    if(indices instanceof Array) {
      indices.forEach(index => synchronizer.RemoveItem(this, client.initIndex(index)));
    }else{
        synchronizer.RemoveItem(this, client.initIndex(indices));
    }
  });
}
