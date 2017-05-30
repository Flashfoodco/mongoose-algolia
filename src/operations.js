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
            if(indices instanceof Array) {
                indices.forEach(index => synchronizer.SyncItem(this, client.initIndex(index)));
            }else{
                synchronizer.SyncItem(this, client.initIndex(indices));
            }
        } else {
            options.dependency.onDependencySaved(this, OnDependentUpdated(indices));


        }
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
            options.dependency.onDependencyDeleted(this, OnDependentUpdated(indices));

        }
    });

    this.post('update', function() {
        var query = this;
        let indices = utils.GetIndexName(this, options.indexName);
        if (!options.dependency) {

            if (options.modelProvider) {
                var model = options.modelProvider();
                if (!model) {
                    return;
                }
                model.find(query.getQuery(), function(err, items){
                    if (err) {
                        console.error(err);
                    } else {
                        var syncItems = function(index, items) {
                            items.forEach(item => {
                                item.wasModified = true;
                            synchronizer.SyncItem(item, client.initIndex(indices));

                        });
                        }

                        if(indices instanceof Array) {
                            indices.forEach(index => syncItems(index, items));
                        }else{
                            syncItems(indices, items)
                        }
                    }

                });
            }

        } else {
            if (options.modelProvider) {
                var model = options.modelProvider();
                if (!model) {
                    return;
                }
                model.find(query.getQuery(), function(err, items){
                    if (err) {
                        console.error(err);
                    } else {

                        options.dependency.onDependenciesUpdated(items, OnDependentUpdated(indices));
                    }
                });
            }

        }
    });


    function OnDependentUpdated(indices) {

        return function(dependentItems) {
            if (!dependentItems) {
                dependentItems = [];
            }

            var isArray = dependentItems instanceof Array;
            if(isArray === false) {
                dependentItems = [dependentItems];
            }

            var itemsToSync = dependentItems;

            itemsToSync.forEach(function (item) {
                item.wasModified = true;

                if(indices instanceof Array) {
                    indices.forEach(index => synchronizer.SyncItem(item, client.initIndex(index)));
                }else{
                    synchronizer.SyncItem(item, client.initIndex(indices));
                }
            });
        }

    }


}
