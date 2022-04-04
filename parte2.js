const DEFAULT_LANG = {
    button: {
        add: "Agregar cuenta"
    },
    msg: {
        error: "Se ha producido un error",
        confirm: "¿Confirma el cambio de personaje?"
    },
    modal: {
        password_placeholder: "",
        password_label: "Contraseña",
        username_label: "Nombre de usuario",
        username_placholder: "",
        login_button: "Conectarse"
    }
};

const DEFAULT_OPT = {
    logo: '',
    enableReorder: true,
    confirm: false,
    updateAvatar: true,
    customButtons: [],
    blockClass: 'switcheroo',
    deleteIcon: `×`,
    addIcon: `+`,
    errorMsg: 'Se ha producido un error.',
    confirmMsg: '¿Confirma el cambio de personaje?',
    modal: {}
};

function extend(obj1, obj2) {
    var keys = Object.keys(obj2);
    for (var i = 0; i < keys.length; i += 1) {
        var val = obj2[keys[i]];
        obj1[keys[i]] = ['string', 'number', 'array', 'boolean'].indexOf(typeof val) === -1 ? extend(obj1[keys[i]] || {}, val) : val;
    }
    return obj1;
}

(function (global) {
    'use strict';

    global.monomer = global.monomer || new MONOMER();

    function Switcheroo(selector = '#switcheroo', options = {}, lang = {}) {
        this.component = document.querySelector(selector);


        this.options = extend(DEFAULT_OPT, options);
        this.lang = extend(DEFAULT_LANG, lang);

        this.createFormModal(this.options.modal);

        this.elements = {
            loginButton: document.querySelector('[data-action="open-login"]'),
            loginFormID: 'fa-login-form',
            classPrefix: '.' + this.options.blockClass,
            deleteButtonClass: '.' + this.options.blockClass + '__delete'
        };

        if (!localStorage.hasOwnProperty('switcheroo')) {
            localStorage.setItem('switcheroo', "[]");
        }

        this.buildSwitcheroo();

        this.bindEvents();
    }

    Switcheroo.prototype.bindEvents = function () {
        let t = this;

        document.delegateEventListener('click', '[data-action="open-login"]', e => {
            this.loginModal.open();
        });

        document.delegateEventListener('click', '[data-action="switcheroo"]', function (e) {
            if (t.isCloseButton(e)) {
                t.deleteRecord(this.dataset.id);
            }
        });

        if (t.options.updateAvatar) {
            document.delegateEventListener('contextmenu', '[data-action="switcheroo"].active', function (e) {
                t.updateAvatar(this, e);
            });
        }

        document.delegateEventListener('click', '[data-action="switcheroo"]:not(.active)', function (e) {
            if (!t.isCloseButton(e)) {
                if (t.options.confirm) {
                    var r = confirm(t.lang.msg.confirm);
                    if (r == true) {
                        t.switch(this);
                    }
                } else {
                    t.switch(this);
                }
            }
        });

    };

    Switcheroo.prototype.isUserLoggedIn = function () {
        return monomer.user().logged();
    };

    Switcheroo.prototype.add = async function (form) {
        let fields = monomer.getFormData(form);
        let credentials = (({ username, password }) => ({ username, password: monomer.cipher(password) }))(fields);

        /* new async/await way */
        if (this.isUserLoggedIn()) await this.logout();

        await this.login(credentials, (data) => {
            credentials = Object.assign({}, credentials, this.updateCredentials(data));
            this.update(credentials);
            monomer.reload();
        }, () => {
            this.errorAlert();
        });
        /* end */
    }

    Switcheroo.prototype.switch = async function (user) {
        let id = user.dataset.id;
        let switcheroo = this.findSwitcheroo(id);
        if (!switcheroo) return this.errorAlert();

        if (this.isUserLoggedIn()) await this.logout();
        await this.login(switcheroo, monomer.reload, () => {
            this.errorAlert();
        });
    }

    Switcheroo.prototype.login = function (credentials, success, error) {
        return monomer.login(credentials['username'], monomer.decipher(credentials['password']))
            .then(res => {
                this.statusCallbacks(res, success, error);
            });
    };

    Switcheroo.prototype.logout = function (success, error) {
        let t = this;
        return monomer.logout().then(res => {
            this.statusCallbacks(res, success, error);
        });
    };

    Switcheroo.prototype.statusCallbacks = function (res, success, error) {
        if (res.status) {
            if (success) success(res.data);
        } else {
            if (error) error(res.data);
        }
    };

    Switcheroo.prototype.errorAlert = function () {
        alert(this.lang.msg.error);
    };

    Switcheroo.prototype.update = function (credentials) {
        if (!this.credentialsExists(credentials['id'])) {
            this.switcherooCredentials.push(credentials);
            this.updateStorage();
        }
    };

    Switcheroo.prototype.findSwitcheroo = function (id) {
        return this.switcherooCredentials.find(x => x.id === id);
    }

    Switcheroo.prototype.deleteSwitcheroo = function (id) {
        this.switcherooCredentials = this.switcherooCredentials.filter(function (obj) {
            return obj.id !== id;
        });
    };

    Switcheroo.prototype.updateCredentials = function (data) {
        // make sure everything is formatted for localstorage
        return {
            id: this.catchID(data),
            avatar: this.catchAvatar(data),
            username: this.catchUsername(data)
        }
    };

    Switcheroo.prototype.credentialsExists = function (id) {
        return this.switcherooCredentials.some(function (el) {
            return el.id === id;
        });
    };

    Switcheroo.prototype.updateAvatar = function (user, e) {
        e.preventDefault();
        let user_id = user.dataset.id;
        let toUpdate = this.findSwitcheroo(user_id);
        let currentAvatar = monomer.user().avatar();
        if (toUpdate['avatar'] == currentAvatar) return;
        toUpdate['avatar'] = currentAvatar;
        this.updateRecord();
    };

    Switcheroo.prototype.updateRecord = function () {
        this.updateStorage();
        monomer.reload();
    };

    Switcheroo.prototype.deleteRecord = function (id) {
        this.deleteSwitcheroo(id);
        this.updateStorage();
        monomer.reload();
    };

    Switcheroo.prototype.updateStorage = function (obj) {
        localStorage.setItem('switcheroo', JSON.stringify(obj || this.switcherooCredentials));
    };

    Switcheroo.prototype.isCloseButton = function (e) {
        var el = e.target;
        return el.matches(this.elements.deleteButtonClass);
    };

    Switcheroo.prototype.catchAvatar = function (data) {
        let pattern = new RegExp(/_userdata\["avatar"\] = "(.+)";/, "gm");
        return pattern.exec(data)[1];
    }

    Switcheroo.prototype.catchID = function (data) {
        let pattern = new RegExp(/_userdata\["user_id"\] = (\d+);/, "gm");
        return pattern.exec(data)[1];
    };

    Switcheroo.prototype.catchUsername = function (data) {
        let pattern = new RegExp(/_userdata\["username"\] = "(.+)";/, "gm");
        return pattern.exec(data)[1];
    };

    Switcheroo.prototype.buildSwitcheroo = function () {
        var c = this.options.blockClass;
        this.component.style.userSelect = 'none';
        this.switcherooCredentials = JSON.parse(localStorage.getItem('switcheroo'));

        let docFrag = document.createDocumentFragment();

        let wrapper = document.createElement('ul');
        wrapper.classList.add(c + '__squircles');

        if (this.options.logo) {
            this.createLogoElement(wrapper);
        }

        this.switcherooCredentials.forEach(el => {
            this.createSwitcherooUser(el, wrapper);
        });

        /* options */
        const login = document.createElement('li');
        login.classList.add(c + '__squircle', c + '__squircle--button');
        login.dataset.action = 'open-login';
        login.innerHTML = this.options.addIcon;
        login.appendChild(this.createTooltip(this.lang.button.add))
        wrapper.appendChild(login);

        this.createCustomButtons(wrapper);

        docFrag.appendChild(wrapper);
        this.component.appendChild(docFrag);

    };

    Switcheroo.prototype.createSwitcherooUser = function (user, wrapper) {
        let c = this.options.blockClass;
        let list = document.createElement("li");

        list.classList.add(c + '__squircle');
        list.dataset.id = user.id;
        list.classList.toggle('active', (user.id == monomer.user().id()));
        /* draggable */
        if (this.options.enableReorder) {
            list.draggable = true;
            list.addEventListener('dragstart', this.dragStart.bind(this));
            list.addEventListener('dragover', this.dragOver.bind(this));
            list.addEventListener('dragend', this.dragEnd.bind(this));
        }
        list.dataset.action = 'switcheroo';


        // create avatar
        let avatar = document.createElement("div")
        avatar.classList.add(c + '__avatar');
        avatar.innerHTML = user.avatar.replace(/\\"/g, '"');
        if (this.options.enableReorder) {
            avatar.draggable = false;
            avatar.querySelector('img').draggable = false;
        }
        list.appendChild(avatar);

        // create popper
        list.appendChild(this.createTooltip(user.username));

        // create delete
        let del = document.createElement('div');
        del.classList.add(c + '__delete');
        if (this.options.enableReorder) {
            del.draggable = false;
        }
        del.innerHTML = this.options.deleteIcon;
        list.appendChild(del);

        wrapper.appendChild(list);
    };

    Switcheroo.prototype.createLogoElement = function (wrapper) {
        let c = this.options.blockClass;
        let logo = document.createElement('a');
        logo.classList.add(c + '__squircle', c + '__logo');
        logo.href = '/';
        logo.innerHTML = this.options.logo;
        logo.appendChild(this.createTooltip('Accueil'));
        wrapper.appendChild(logo);
        this.createDividerLine(wrapper);
    };

    Switcheroo.prototype.createDividerLine = function (wrapper) {
        const divider = document.createElement('li');
        divider.classList.add(this.options.blockClass + '__divider');
        wrapper.appendChild(divider);
    };

    Switcheroo.prototype.createCustomButtons = function (wrapper) {
        const t = this;
        const buttons = this.options.customButtons;
        const c = this.options.blockClass;
        if (buttons.length > 0) {
            buttons.forEach(el => {
                if (!el) return;
                let button;
                const isValidLink = (monomer.isValidURL(el.action) || (typeof el.action === 'string' && el.action.indexOf('/') === 0));
                if (isValidLink) {
                    button = document.createElement('a');
                    button.href = el.action;
                } else if (typeof el.action === 'function') {
                    button = document.createElement('div');
                    button.addEventListener('click', function (e) {
                        el.action.call(t, e, this);
                    });
                }
                if (!button) return false;
                if (Array.isArray(el.classes)) button.classList.add(...el.classes.map(x => `${c}__button--${x}`));
                if (typeof el.before === "boolean" && el.before) button.style.order = "-1";
                button.classList.add(c + '__squircle', c + '__button');
                button.innerHTML = el.html;
                if (el.tooltip && typeof el.tooltip === "string") button.appendChild(this.createTooltip(el.tooltip));
                wrapper.appendChild(button);
            });
        }
    };

    Switcheroo.prototype.createTooltip = function (tooltip) {
        let c = this.options.blockClass;
        // create popper
        let popper = document.createElement("div");
        if (this.options.enableReorder) {
            popper.draggable = false;
        }
        popper.classList.add(c + '__popper');
        // create popper text
        let textNode = document.createElement("div");
        textNode.classList.add(c + '__popper-text');
        if (this.options.enableReorder) {
            textNode.draggable = false;
        }
        textNode.innerHTML = tooltip;
        popper.appendChild(textNode);
        return popper;
    };

    Switcheroo.prototype.createFormModal = function (options) {
        let t = this;
        const form = document.createDocumentFragment();
        const c = 'switcheroo';

        const vdom = VD.h('form', {
            className: c + '__form',
            name: 'form_login',
            method: 'post',
            action: '/login',
            onSubmit: (e) => {
                e.preventDefault();
                this.add(e.target);
            }
        },
            VD.h('div', {
                className: c + '__form-row'
            },
                VD.h('label', {
                    for: c + '-username',
                    className: c + '__form-label'
                }, t.lang.modal.username_label),
                VD.h('input', {
                    type: 'text',
                    className: c + '__form-input',
                    id: c + '-username',
                    name: 'username',
                    required: true,
                    maxlength: '40'
                }),
            ),
            VD.h('div', {
                className: c + '__form-row'
            },
                VD.h('label', {
                    for: c + '-password',
                    className: c + '__form-label'
                }, t.lang.modal.password_label),
                VD.h('input', {
                    className: c + '__form-input',
                    type: 'password',
                    id: c + '-password',
                    name: 'password',
                    required: true,
                    maxlength: '32'
                })
            ),
            VD.h('input', {
                type: 'checkbox',
                style: 'display: none;',
                name: 'autologin',
                checked: true
            }),
            VD.h('div', {
                className: c + '__form-row'
            },
                VD.h('button', {
                    name: 'login',
                    className: c + '__form-button'
                }, t.lang.modal.login_button)
            )
        );

        form.appendChild(VD.createElement(vdom));

        this.loginModal = monomer.modal({
            content: VD.createElement(vdom),
            maxWidth: 400
        });
    };

    Switcheroo.prototype.isBefore = function (el1, el2) {
        let cur;
        if (el2.parentNode === el1.parentNode) {
            for (cur = el1.previousSibling; cur; cur = cur.previousSibling) {
                if (cur === el2) return true;
            }
        }
        return false;
    };

    Switcheroo.prototype.dragStart = function (e) {
        e.stopPropagation();
        let target = e.target;
        target.closest('.' + this.options.blockClass).classList.add('dragged');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', this.innerHTML);
        this.draggedElement = target;
    };

    Switcheroo.prototype.dragOver = function (e) {
        e.stopPropagation();
        let target = e.target.closest('li');
        if (this.isBefore(this.draggedElement, target)) {
            this.insertDraggedBefore(this.draggedElement, target);
        } else {
            this.insertDraggedBefore(this.draggedElement, target.nextSibling);
        }
    };

    Switcheroo.prototype.insertDraggedBefore = function (el1, el2) {
        el2.parentNode.insertBefore(el1, el2);
    };

    Switcheroo.prototype.dragEnd = function (e) {
        e.stopPropagation();
        e.target.closest('.' + this.options.blockClass).classList.remove('dragged');
        this.draggedElement = null;
        this.sortSwitcheroo();
    };

    Switcheroo.prototype.sortSwitcheroo = function () {
        let els = document.querySelectorAll('#switcheroo [data-id]');
        /* get new order */
        let newOrder = [];
        els.forEach(el => {
            newOrder.push(el.dataset.id);
        });


        let result = [];
        newOrder.forEach((key) => {
            /* go through each id added in new order */
            var found = false;
            this.switcherooCredentials.filter(function (item) {
                if (!found && item.id == key) {
                    result.push(item);
                    found = true;
                    return false;
                }
                return true;
            })
        });
        this.updateStorage(result);
    };

    global.Switcheroo = Switcheroo;
})(window);
