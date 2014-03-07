define('app/controllers/machine_keys', ['ember'],
    /**
     * Machine Keys Controller
     *
     * @returns Class
     */
    function () {
        return Ember.Object.extend(Ember.Evented, {

            /**
             *  Properties
             */

            view: null,
            machine: null,
            callback: null,


            /**
             *
             *  Initialization
             *
             */

            load: function() {

                // Add event listeners
                Mist.keysController.on('onKeyListChange', this, '_updateKeys');
                Mist.keysController.on('onKeyAssociate', this, '_updateKeys');
                Mist.keysController.on('onKeyDisassociate', this, '_updateKeys');

            }.on('init'),


            /**
             *
             *  Methods
             *
             */

            open: function (machine, callback) {
                $('#machine-keys-panel').panel('open');
                this._clear();
                this.set('machine', machine);
                this.set('callback', callback);
            },


            openKeyList: function (machine, callback) {
                this.set('machine', machine);
                this.set('callback', callback);
                this.view._actions.associateClicked();
            },


            close: function () {
                $('#machine-keys-panel').panel('close');
                this._clear();
            },


            associate: function (key, callback) {
                key.associate(this.machine, callback);
            },


            probe: function(key, callback) {
                this.machine.probe(key.id, callback);
            },


            disassociate: function(key, callback) {
                // Check if this is the last key of the machine
                if (Mist.keysController.getMachineKeysCount(this.machine) == 1) {
                    var machine = this.machine;
                    Mist.confirmationController.set('title', 'Disassociate key');
                    Mist.confirmationController.set('text', 'You are about to remove the last key associated with "' +
                        machine.name + '" machine and you won\'t be able to access it anymore. Are you sure ' +
                        'you want to proceed?');
                    Mist.confirmationController.set('callback', function () {
                        key.disassociate(machine, callback);
                    });

                    // Open confirmation just a bit later
                    // so that key actions popup has enough
                    // time to close
                    Ember.run.later(function() {
                        Mist.confirmationController.show();
                    }, 300);
                } else {
                    key.disassociate(this.machine, callback);
                }
            },


            /**
             *
             *  Pseudo-Private Methods
             *
             */

            _clear: function () {
                Ember.run(this, function () {
                    this.set('machine', null);
                    this.set('callback', null);
                });
            },


            _updateKeys: function () {
                if (!this.machine) return;

                var that = this;
                Ember.run(function () {
                    var found = false;
                    var newAssociatedKeys = [];
                    var newNonAssociatedKeys = [];
                    Mist.keysController.content.forEach(function (key) {
                        found = false;
                        key.machines.some(function (machine) {
                            if (that.machine.id == machine[1] && that.machine.backend.id == machine[0]) {
                                newAssociatedKeys.push(key);
                                return found = true;
                            }
                        });
                        if (!found) newNonAssociatedKeys.push(key);
                    });
                    that.set('associatedKeys', newAssociatedKeys);
                    that.set('nonAssociatedKeys', newNonAssociatedKeys);
                });
            },


            _giveCallback: function (success, action) {
                if (this.callback) this.callback(success, action);
            },


            /**
             *
             *  Observers
             *
             */

            machineObserver: function () {
                Ember.run.once(this, '_updateKeys');
            }.observes('machine')
        });
    }
);