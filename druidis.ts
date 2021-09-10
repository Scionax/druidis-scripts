import Account from "./classes/Account.ts";
import API from "./classes/API.ts";
import MainSection from "./classes/MainSection.ts";
import Nav from "./classes/Nav.ts";


API.initialize();
MainSection.initialize();
Nav.initialize();
Nav.runPageUpdate();
Account.initialize();
