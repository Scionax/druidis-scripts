import Account from "./classes/Account.ts";
import API from "./classes/API.ts";
import Nav from "./classes/Nav.ts";
import Webpage from "./classes/Web.ts";


API.initialize();
Webpage.initialize();
Nav.initialize();
Nav.runPageUpdate();
Account.initialize();
