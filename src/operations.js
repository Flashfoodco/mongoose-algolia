'use strict';

const utils = require('./utils');

module.exports = function(options,client, synchronizer){

  this.pre('save',function(next) {
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
    let indices = utils.GetIndexName(this,options.indexName);

    var itemsToSync = [];

    if (!options.dependency) {
        itemsToSync = [this];
    } else {
        var dependentItems = options.dependency.onDependencySaved(this);
        if (!dependentItems) {
            dependentItems = [];
        }

        var isArray = dependentItems instanceof Array;
        if(isArray === false) {
            dependentItems = [dependentItems];
        }

        itemsToSync = dependentItems;
    }

    itemsToSync.forEach(new function (item) {
        if(indices instanceof Array) {
            indices.forEach(index => synchronizer.SyncItem(item, client.initIndex(index)));
        }else{
            synchronizer.SyncItem(item, client.initIndex(indices));
        }
    });
  });

  this.post('remove',function(){
    let indices = utils.GetIndexName(this,options.indexName);

      if (!options.dependency) {
          if(indices instanceof Array) {
              indices.forEach(index => synchronizer.RemoveItem(this, client.initIndex(index)));
          }else{
              synchronizer.RemoveItem(this, client.initIndex(indices));
          }

      } else {
          var dependentItems = options.dependency.onDependencyDeleted(this);
          if (!dependentItems) {
              dependentItems = [];
          }

          var isArray = dependentItems instanceof Array;
          if(isArray === false) {
              dependentItems = [dependentItems];
          }

          var itemsToSync = dependentItems;

          itemsToSync.forEach(new function (item) {
              if(indices instanceof Array) {
                  indices.forEach(index => synchronizer.SyncItem(item, client.initIndex(index)));
              }else{
                  synchronizer.SyncItem(item, client.initIndex(indices));
              }
          });
      }
  });


}
