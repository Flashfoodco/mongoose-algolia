'use strict';

const deepKeys = require('deep-keys');

function GetIndexName(doc,indexName) {
  return (typeof indexName === 'string') ? indexName : indexName.call(null,doc) ;
}

function ApplyPopulation(doc,populate) {
  return new Promise((resolve,reject) => {
    if(!populate) return resolve(doc);

    doc.populate(populate,(err, populatedDoc) => {
      if(err) return reject(err);
      return resolve(populatedDoc);
    });
  });
}

function ApplyMappings(doc, mappings) {
  if(!mappings) return doc;

  Object.keys(mappings).forEach(key => {
    if(mappings[key] instanceof Array === false && typeof mappings[key] === 'object') {
      if(doc[key] instanceof Array === false && typeof doc[key] === 'object'){
        doc[key] = ApplyMappings(doc[key], mappings[key]);
      }
    }else{
      if (doc[key]) {
        doc[key] = mappings[key](doc[key]);
      }
    }
  });

  return doc;
}

function ApplyDefaults(doc, defaults) {
  if(!defaults) return doc;

  Object.keys(defaults).forEach(key => {
    if(defaults[key] instanceof Array === false && typeof defaults[key] === 'object'){
      doc[key] = ApplyDefaults(doc[key] || {}, defaults[key]);
    }else{
      if((doc[key] instanceof Array && !doc[key].length) || !doc[key]) doc[key] = defaults[key];
    }
  });

  return doc;
}

function ApplyInflator(doc, inflator) {
    if(!inflator) return doc;

    inflator(doc);

    return doc;
}

function ApplySelector(doc,selector) {
  if(!selector) return doc;

  let keys = selector.split(' ');
  let remove = keys.filter(key => /^-{1}.+/.test(key)).map(key => key.substring(1));
  let keep = keys.filter(key => /^(?!-{1}).+/.test(key));

  if(keep.length){
    let modifiedDoc = {};

    keep.forEach(entry => {
      if(entry.includes('.')) {
        setObjectPathValue(modifiedDoc,entry,getObjectPathValue(doc,entry));
      }else{
        modifiedDoc[entry] = doc[entry];
      }
    });

    doc = modifiedDoc;
  }else if(remove.length) {
    remove.forEach(key => deleteObjectPathValue(doc, key));
  }

  return doc;
}

function GetRelevantKeys(doc, selector){
  if(!selector) return null;

  delete doc._id;
  delete doc.__v;

  let keys = selector.split(' ');
  let remove = keys.filter(key => /^-{1}.+/.test(key)).map(key => key.substring(1));
  let keep = keys.filter(key => /^(?!-{1}).+/.test(key));

  if(keep.length){
    return keep;
  }else if(remove.length) {
    let keys = deepKeys(doc);
    return keys.filter(key => !remove.includes(key));
  }
}

function setObjectPathValue(source, path, value) {
    let parts = path.split('.'), len = parts.length, target = source;

    for (let i = 0, part; i < len - 1; i++) {
        part = parts[i];
        target = target[part] == undefined ? (target[part] = {}) : target[part];
    }
    target[parts[len - 1]] = value;
    return target;
}

function getObjectPathValue(source, path) {
    let parts = path.split('.'), len = parts.length, result = source;

    for(let i = 0; i < len - 1; i++) {
      result = (typeof result === 'object' && parts[i] in result) ? result[parts[i]] : undefined ;
    }

    return typeof result === 'object' ? result[parts[parts.length - 1]] : undefined;
}

function deleteObjectPathValue(source, path) {
    let parts = path.split('.'), len = parts.length, target = source;

    for (let i = 0, part; i < len - 1; i++) {
        part = parts[i];
        target = target[part] == undefined ? (target[part] = {}) : target[part];
    }
    delete target[parts[len - 1]];
    return target;
}

module.exports = {
  GetIndexName,
  ApplySelector,
  ApplyPopulation,
  ApplyDefaults,
  ApplyMappings,
  GetRelevantKeys,
  ApplyInflator
}
