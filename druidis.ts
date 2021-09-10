import Account from "./classes/Account.ts";
import Alerts from "./classes/Alerts.ts";
import Config from "./classes/Config.ts";
import Nav from "./classes/Nav.ts";


Config.initialize();
Alerts.purgeAlerts();
Nav.updateURL(false);
Nav.runPageUpdate();
Account.initialize();
