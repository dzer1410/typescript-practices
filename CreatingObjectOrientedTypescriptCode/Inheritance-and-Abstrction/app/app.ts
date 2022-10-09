import { CheckingAccount } from './checking-account';
import { Renderer } from './renderer';
import { BankAccount } from './bank-account';
import { SavingsAccount } from './savings-account';
import { AccountType } from './enums';
import { AccountList } from './account-list';
import { ATM } from './atm';

class Main {
    checkingAccount?: CheckingAccount;
    savingsAccount?: SavingsAccount;
    currentAccount?: BankAccount;
    atm?: ATM;

    constructor(private renderer: Renderer) {}

    async loadAccounts(){
        const response = await fetch('data.json');
        const data = await response.json();
        this.checkingAccount = new CheckingAccount({ ...data.checkingAccount });
        this.savingsAccount = new SavingsAccount({ ...data.savingsAccount })
        this.atm = new ATM(this.checkingAccount);
        let html = this.renderAccounts();
        this.renderer.render(`
            <h2>Welcome to Acme Bank!</h2><br />
            <image src="images/acmebank.jpg" height="150">
            <br /><br />
            <h5>Your Accounts:</h5><br />
            ${html}
        `);
    }

    changeView(view?: string) {
        switch (view) {
            case 'checking':
                this.currentAccount = this.checkingAccount;
                break;
            case 'savings':
                this.currentAccount = this.savingsAccount;
                break;
            case 'atm':
                this.currentAccount = this.checkingAccount;
                this.renderAtm();
                return;
        }
        if(this.currentAccount){
            this.renderAccount(this.currentAccount);
        }
    }

    renderAtm() {
        const html = `
                <h3>ATM</h3>
                <image src="images/atm.jpg" height="150">
                <br /><br />
                Current Checking Account Balance: $${this.checkingAccount?.balance}
                <br /><br />
                $<input type="text" id="depositWithdrawalAmount">&nbsp;&nbsp;
                <button onclick="main.depositWithDrawal(true, true)">Deposit</button>&nbsp;
                <button onclick="main.depositWithDrawal(false, true)">Withdrawal</button>&nbsp;
            `;
        this.renderer.render(html);
    }

    renderAccounts() {
        let acctsHtml: string = '';       
        const accList = new AccountList();
        accList.add(<CheckingAccount>this.checkingAccount);
        accList.add(<SavingsAccount>this.savingsAccount);

        accList.getAccounts().forEach((acct, index) => {  
            acctsHtml += acct.title + '<br />';
        });
        return acctsHtml;
    }

    renderAccount(account: BankAccount) {
        const accountType = AccountType[account.accountType];
        const html = `
                <h3>${accountType} Account</h3>
                <br />
                <span class="label">Owner:</span> ${account.title}
                <br />
                <span class="label">Balance:</span> $${account.balance.toFixed(2)}
                <br /><br />
                $<input type="text" id="depositWithdrawalAmount">&nbsp;&nbsp;
                <button onclick="main.depositWithDrawal(true)">Deposit</button>&nbsp;
                <button onclick="main.depositWithDrawal(false)">Withdrawal</button>&nbsp;
            `;
        this.renderer.render(html);
    }

    depositWithDrawal(deposit: boolean, atm?: boolean) {
        let amountInput: HTMLInputElement = <HTMLInputElement>document.querySelector('#depositWithdrawalAmount');
        let amount = +amountInput.value;
        let error: any;
        try {
            if (deposit) {
                if (atm) {
                    this.atm?.deposit(amount);
                }
                else {
                    if(this.currentAccount){
                        this.currentAccount.deposit(amount);
                    }
                }
            }
            else {
                if (atm) {
                    this.atm?.withdrawal(amount);
                }
                else {
                    if(this.currentAccount){
                        this.currentAccount.withdrawal(amount);
                    }
                }
            }
        }
        catch (e) {
            error = e;
        }

        (atm) ? this.renderAtm(): this.renderAccount(<BankAccount>this.currentAccount);
        if (error) {
            this.renderer.renderError(error.message);
        }
    }
}

// Create main object and add handlers for it
const renderer = new Renderer(<HTMLDivElement>document.querySelector('#viewTemplate'));
const main = new Main(renderer);
main.loadAccounts();

// Quick and easy way to expose a global API that can hook to the Main object
// so that we can get to it from click and events and others.
// Yes, there are other ways but this gets the job done for this demo.
(<any>window).main = main;