export class Course {   

    constructor(courseId, modules = {}, moduleCount = 0, totalErrors = 0) {
        this.modules = modules;
        this.moduleCount = moduleCount;
        this.id = courseId;
        this.errorCount = totalErrors;
    }

    addModule(module) {//add new module
        this.moduleCount++;
        this.modules[module.id] = module.serialize();
        return this.modules[module.id];
    }

    hasModule(moduleId) {
        this.modules.forEach((mod) => {
            let m = Module.deserialize(mod);
            if(m.id === moduleId) {
                return m;
            }
        })

        return -1;
    }

    getModule(moduleId) {
        let _m;

        //check if module already saved. If so, fetch it
        if(this.moduleExists(moduleId)) {
            _m =  this.modules[moduleId];
        }

        //return module if found
        if(_m != null && _m != undefined) {return Module.deserialize(_m);}

        //recursion | return new module if one not found
        this.modules[moduleId] = new Module(moduleId).serialize();
        return this.getModule(moduleId);
    }

    moduleExists(moduleId) {
        let condition = false;
        Object.keys(this.modules).forEach(function(key) {
            if(moduleId === key) {
                condition = true;
                return condition;
            }
        });

        return condition;
    }

    setModule(module) {
        this.modules[module.id] = module.serialize();
    }

    addError(e, saveInfo) {
        //returns desired module (or a new copy if it doesn't exist) as Module Item
        let _module = this.getModule(saveInfo.moduleId);
        _module.addError(e, saveInfo);
        this.setModule(_module);
        this.totalErrors++;
    }

    removeError(errorId, saveInfo) {
        //returns desired module (or a new copy if it doesn't exist) as Module Item
        let _module = this.getModule(saveInfo.moduleId);
        _module.removeError(errorId, saveInfo);
        this.setModule(_module);
        this.totalErrors--;
    }

    serialize() {//serialize course for JSON
        return JSON.stringify(this);
    }

    static deserialize(serialized) {
        const obj = JSON.parse(serialized);
        return new Course(obj.id, obj.modules, obj.moduleCount, obj.totalErrors);
    }
}

export class Module {

    constructor(number, moduleItems = {}, count = 0) {
        this.moduleItems = moduleItems;
        this.count = count;
        this.id = number;
        this.errorCount;
        this.title;
    }

    addItem(item) {
        this.count++;
        this.moduleItems[item.id] = item.serialize();
        return this.moduleItems[item.id];
    }

    addError(e, saveInfo) {
        let item = this.getModuleItem(saveInfo);
        item.addError(e)
        this.setModuleItem(item);
    }

    removeError(errorId, saveInfo) {
        let item = this.getModuleItem(saveInfo);
        item.removeError(errorId)
        this.setModuleItem(item);
    }

    getModuleItem(saveInfo) {
        let _item;

        //check if module Item already created
        if(this.moduleItemExists(saveInfo.moduleItemId)) {
            _item = this.moduleItems[saveInfo.moduleItemId];
        }

        if(_item != null && _item != undefined) {return ModuleItem.deserialize(_item); }

        //recursion | return new module if one not found
        this.moduleItems[saveInfo.moduleItemId] = new ModuleItem(saveInfo.moduleId, saveInfo.moduleItemId, saveInfo.pageType, saveInfo.pageTitle).serialize();
        return this.getModuleItem(saveInfo);
    }

    moduleItemExists(moduleItemId) {
        let condition = false;
        Object.keys(this.moduleItems).forEach(function(key) {
            if(moduleItemId === key) {
                condition = true;
                return condition;
            }
        });

        return condition;
    }

    setModuleItem(moduleItem) {
        this.moduleItems[moduleItem.id] = moduleItem.serialize();
    }

    serialize() {
        return JSON.stringify(this);
    }

    static deserialize(serialized) {
        const obj = JSON.parse(serialized);
        return new Module(obj.id, obj.moduleItems, obj.count);
    }
}

export class ModuleItem {

    constructor(moduleId, id, type, title, count = 0, errors = {}) {
        this.errors = errors;
        this.count = count;
        this.id = id;
        this.url;
        this.title = title;
        this.type = type;
        this.moduleId = moduleId;
        this.errorCount;
    }

    addError(e) {
        //grab error or make a new one if needed
        if(this.errorArrayExists(e)) {
            this.errors[e.name].push(e.serialize());
        }
        else {
            this.errors[e.name] = [];
            this.errors[e.name].push(e.serialize());
        }
        this.count++;
    }

    removeError(errorId) {
        Object.keys(this.errors).forEach(function(key) {
            let index = 0;
            this.errors[key].forEach((error) => {
                let _e = Page_Error.deserialize(error);

                if(_e.id === errorId) {
                    this.errors[key].splice(index, 1);
                    return;
                }
                index++;
            })
        });
        this.count--;
        console.log("found error");
    }

    findError(id) {
        let _key, _index;
        Object.keys(this.errors).forEach(function(key) {
            let index= 0;
            this.errors[key].forEach((error) => {
                let e = Page_Error.deserialize(error);
                if(error.id === id) {
                    _key = key;
                    _index = index;
                }
                index++;
            })
        });

        const respone = {
            index: _index,
            key: _key,
        }

        return respone;
    }

    errorArrayExists(e) {
        let condition = false;
        Object.keys(this.errors).forEach(function(key) {
            if(e.name === key) {
                condition = true;
                return condition;
            }
        });

        return condition;
    }

    errorCountAll() {
        return this.count;
    }

    errorCountSingle(name) {
        const tempJSON = JSON.parse(this.errors);

        //if specific errors exist
        if(name in tempJSON) {
            return tempJSON[name].length;
        } else {//if error type not on page
            return 0;
        }
    }

    errorsList() {
        return this.errors;
    }

    serialize() {
        return JSON.stringify(this);
    }

    static deserialize(serialized) {
        const obj = JSON.parse(serialized);
        return new ModuleItem(obj.moduleId, obj.id, obj.type, obj.title, obj.count, obj.errors);
    }
}

export class Page_Error {
    constructor(name, desc, tooltip,htmlRef, id) 
    {
      this.name = name;
      this.desc = desc;
      this.tooltip = tooltip;
      this.htmlRef = htmlRef;
      this.id = id;
    }
  
    serialize() {
      return JSON.stringify(this);
    }
  
    static deserialize(serialized) {
      const obj = JSON.parse(serialized);
      return new Page_Error(obj.name, obj.desc, obj.tooltip, obj.htmlRef, obj.id);
    }
}