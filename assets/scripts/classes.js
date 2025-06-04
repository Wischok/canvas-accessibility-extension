export class Course {

    constructor(courseId, version, title, modules = {}, moduleCount = 0, errorCount = 0, professorName = "") {
        this.modules = modules;
        this.moduleCount = moduleCount;
        this.id = courseId;
        this.errorCount = errorCount;
        this.version = version;
        this.title = title
        this.professorName = professorName
    }

    addModule(module) {//add new module
        this.moduleCount++;
        this.modules[module.id] = module.serialize();
        return this.modules[module.id];
    }

    hasModule(moduleId) {
        this.modules.forEach((mod) => {
            let m = Module.deserialize(mod);
            if (m.id === moduleId) {
                return m;
            }
        })

        return -1;
    }

    gatherErrorCount() {
        let count = 0
        Object.keys(this.modules).forEach((key) => {
            let m = Module.deserialize(this.modules[key]);

            Object.keys(m.moduleItems).forEach((key) => {
                let i = ModuleItem.deserialize(m.moduleItems[key]);

                count += i.count;
            })
        })

        return count;
    }

    setProfName(name) { this.professorName = name; }

    modulesCheckedCount() {
        let count = 0;
        Object.keys(this.modules).forEach((key) => {
            let m = Module.deserialize(this.modules[key]);

            if (m.checked()) {
                count++;
            }
        })

        return count;
    }

    setModule(module) {
        this.modules[module.id] = module.serialize();
    }

    addError(e, pageId) {
        //returns desired module (or a new copy if it doesn't exist) as Module Item
        Object.keys(this.modules).forEach((key) => {
            let module = Module.deserialize(this.modules[key]);

            Object.keys(module.moduleItems).forEach((_key) => {
                let item = ModuleItem.deserialize(module.moduleItems[_key]);

                if (item.id = pageId) {
                    item.addError(e);
                    module.moduleItems[_key] = item.serialize();
                    this.modules[key] = module.serialize();
                }
            })
        });
        this.totalErrors += 1;
    }

    removeError(errorId, saveInfo) {
        //returns desired module (or a new copy if it doesn't exist) as Module Item
        _module.removeError(errorId, saveInfo);
        this.setModule(_module);
        this.totalErrors--;
    }

    fetchModuleItem(url) {
        let moduleItem;
        Object.keys(this.modules).forEach((key) => {
            if (moduleItem != null && moduleItem != undefined) { return moduleItem; }
            let m = Module.deserialize(this.modules[key]);

            Object.keys(m.moduleItems).forEach((_key) => {
                if (moduleItem != null && moduleItem != undefined) { return moduleItem; }
                let i = ModuleItem.deserialize(m.moduleItems[_key]);

                //check by module item id
                if (url.includes(i.id)) {
                    moduleItem = i;
                }

                //check by secondary module item id (url path or 6-7 digit code - depending on page type)
                if (url.includes(i.id2)) {
                    moduleItem = i;
                }
            })
        })

        return moduleItem.serialize();
    }

    fetchModule(url) {
        let module;
        Object.keys(this.modules).forEach((key) => {
            if (module != null && module != undefined) { return module; }
            let m = Module.deserialize(this.modules[key]);

            Object.keys(m.moduleItems).forEach((_key) => {
                if (module != null && module != undefined) { return module; }
                let i = ModuleItem.deserialize(m.moduleItems[_key]);

                //check by module item id
                if (url.includes(i.id)) {
                    module = m;
                }

                //check by secondary module item id (url path or 6-7 digit code - depending on page type)
                if (url.includes(i.id2)) {
                    module = m;
                }
            })
        })

        return module.serialize();
    }

    serialize() {//serialize course for JSON
        return JSON.stringify(this);
    }

    static deserialize(serialized) {
        const obj = JSON.parse(serialized);
        return new Course(obj.id, obj.version, obj.title, obj.modules, obj.moduleCount, obj.errorCount, obj.professorName);
    }
}
export class Module {

    constructor(number, title, published = true, moduleItems = {}, count = 0) {
        this.moduleItems = moduleItems;
        this.count = count;
        this.id = number;
        this.errorCount;
        this.title = title;
        this.published = published;
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
        if (this.moduleItemExists(saveInfo.moduleItemId)) {
            _item = this.moduleItems[saveInfo.moduleItemId];
        }

        if (_item != null && _item != undefined) { return ModuleItem.deserialize(_item); }

        //recursion | return new module if one not found
        this.moduleItems[saveInfo.moduleItemId] = new ModuleItem(saveInfo.moduleId, saveInfo.moduleItemId, saveInfo.pageType, saveInfo.pageTitle).serialize();
        return this.getModuleItem(saveInfo);
    }

    moduleItemExists(moduleItemId) {
        let condition = false;
        Object.keys(this.moduleItems).forEach(function (key) {
            if (moduleItemId === key) {
                condition = true;
                return condition;
            }
        });

        return condition;
    }

    checked() {
        if (this.count < 1) { return false; }

        let modules = this.moduleItems;
        Object.keys(this.moduleItems).forEach(function (key) {
            let item = ModuleItem.deserialize(modules[key]);
            if (item.checked === false) {
                return false;
            }
        })

        return true;
    }

    setModuleItem(moduleItem) {
        this.moduleItems[moduleItem.id] = moduleItem.serialize();
    }

    serialize() {
        return JSON.stringify(this);
    }

    static deserialize(serialized) {
        const obj = JSON.parse(serialized);
        return new Module(obj.id, obj.title, obj.published, obj.moduleItems, obj.count);
    }
}
export class ModuleItem {

    constructor(id, type, title, url, id2 = null, count = 0, errors = {}, checked = false) {
        this.errors = errors;
        this.count = count;
        this.id = id;
        this.url = url;
        if (title === null) {
            this.title = "Placeholder Title";
        }
        else {
            this.title = title;
        }
        this.type = type;
        this.checked = checked;
        this.id2 = id2;
    }

    addError(e) {
        //grab error or make a new one if needed
        if (this.errorArrayExists(e)) {
            this.errors[e.name].push(e.serialize());
        }
        else {
            this.errors[e.name] = [];
            this.errors[e.name].push(e.serialize());
        }
        this.count++;
    }

    clearErrors() {
        this.errors = {};
        this.count = 0;
        this.checked = false;
    }

    //remove error within object. Return removed error for remove
    //in other areas
    removeError(id) {
        //remove error from list
        for (let i = 0; i < this.errors[id.split('-')[0]].length; i++) {
            if (Page_Error.deserialize(this.errors[id.split('-')[0]][i]).id === id) {
                this.count--;
                //remove error from page and return
                return this.errors[id.split('-')[0]].splice(i, 1);
            }
        }
    }

    findErrorLocation(id) {
        let _key, index;
        Object.keys(this.errors).forEach(key => {
            for (let i = 0; i < this.errors[key].length; i++) {
                let errorId = JSON.parse(this.errors[key][i]).id;
                if (errorId === id) {
                    _key = key;
                    index = i;
                }
            }
        });

        const response = {
            index: index,
            key: _key,
        }

        return response;
    }

    addChangeToError(id, change) {
        //grab location of error
        const location = this.findErrorLocation(id);

        //deserealize error and add change
        let error = Page_Error.deserialize(this.errors[location.key][location.index]);
        error.addChange(change);

        this.errors[location.key][location.index] = error.serialize();
    }

    removeChangeFromError(id, change) {
        //grab location of error
        const location = this.findErrorLocation(id);

        //deserealize error and add change
        let error = Page_Error.deserialize(this.errors[location.key][location.index]);
        error.removeChange(change);

        this.errors[location.key][location.index] = error.serialize();
    }

    errorArrayExists(e) {
        let condition = false;
        Object.keys(this.errors).forEach(function (key) {
            if (e.name === key) {
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
        if (name in tempJSON) {
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
        return new ModuleItem(obj.id, obj.type, obj.title, obj.url, obj.id2, obj.count, obj.errors, obj.checked);
    }
}
export class Page_Error {
    constructor(name, path = -1, id = -1, startIndex = -1, endIndex = -1, match = "", changes = {}, required = false) {
        this.name = name;
        this.required = required;
        this.startIndex = startIndex;
        this.endIndex = endIndex;
        this.id = id
        this.path = path;
        this.changes = changes;
        this.match = match;
    }

    serialize() {
        return JSON.stringify(this);
    }

    addChange(change) {
        this.changes[change.key] = change.value;
        console.log(this);
    }

    removeChange(change) {
        delete this.changes[change.key];
        console.log(this);
    }

    static generateRandomId(name) {
        return (
            name +
            '-' +
            Math.floor(Math.random() * 9999).toString() +
            '-' +
            Math.floor(Math.random() * 9999).toString() +
            '-' +
            Date.now().toString()
        )
    }

    static deserialize(serialized) {
        let obj;

        //try and parse
        try {
            obj = JSON.parse(serialized);
        }
        catch {//if fail, serialize, then try and parse again
            obj = JSON.parse(JSON.stringify(serialized));
        }

        return new Page_Error(obj.name, obj.path, obj.id, obj.startIndex, obj.endIndex, obj.match, obj.changes, obj.required);
    }
}
export class Pseudo_Element {
    constructor(tagName, attributes = {}, innerText, path = "-1", children = new Array()) {
        this.tagName = tagName;
        this.attributes = attributes;
        this.children = children;
        this.path = path
        this.innerText = innerText;

        this.voidElements = new Set([
            "area", "base", "br", "col", "embed", "hr", "img", "input", "link",
            "meta", "param", "source", "track", "wbr"
        ]);
    }

    isVoidElement() {
        return (this.voidElements.has(this.tagName));
    }

    serialize() {
        return JSON.stringify(this);
    }

    static deserialize(serialized) {
        const obj = JSON.parse(serialized);
        return new Pseudo_Element(obj.tagName, obj.attributes, obj.innerText, obj.path, obj.children);
    }
}
