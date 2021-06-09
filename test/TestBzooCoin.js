const build = require('./util/build');
const deploy = require('./util/deploy');
const path = require('path');
const fs = require('fs');

const assert = require('assert');
const colors = require('colors');
const util = require('util');


// Set false temporarily to disable all tests except the one under development, and to enable compile/deploy log messages.
const RUN_ALL_TESTS = true;     // This should be always checked in set to true!


// =====================================================================================================================
// === This executes the entire test suite.
// =====================================================================================================================

const log = false;      // Set true to log details.
const nullLogger = {
    log: function () {
    }
};

// Helper values for reference to ETH test accounts.
let owner;
let account1, account2, account3, account4, account5, account6, account7, account8, account9;
let BuyzookaToken = null;

// Build the source contracts, logging build output.
const contractFullPath = './contracts/BuyzookaToken.sol';
build(contractFullPath, console);

const constructorArgs = [];

// If the compile/deploy is failing, set this true to figure out why (but is noisy)
const logDeployAndCompileErrors = true; //!RUN_ALL_TESTS;

const deployLogger = logDeployAndCompileErrors ? console : nullLogger;
beforeEach(async () => {
    // Deploy the source contracts fresh before each test (without rebuild, no deploy output logging).
    const deployment = await deploy(contractFullPath, false, constructorArgs, deployLogger).catch(deployLogger);
    if (deployment !== undefined) {
        owner = deployment.accounts[0];
        account1 = deployment.accounts[1];
        account2 = deployment.accounts[2];
        account3 = deployment.accounts[3];
        account4 = deployment.accounts[4];
        account5 = deployment.accounts[5];
        account6 = deployment.accounts[6];
        account7 = deployment.accounts[7];
        account8 = deployment.accounts[8];
        account9 = deployment.accounts[9];

        BuyzookaToken = deployment.contract;
        if (log) console.log(colors.green('==> BuyzookaToken deployed to ' + BuyzookaToken.options.address));
    }
});


// =====================================================================================================================
// === Utility methods, for use by individual tests.
// =====================================================================================================================

function runThisTest(runIt) {
    return runIt || RUN_ALL_TESTS;
}

function logNamedValue(name, thing) {
    console.log(name + ": " + util.inspect(thing, false, null, true /* enable colors */))
}

// Log an object's inner details to the console
function logValue(thing) {
    logNamedValue('Result', thing);
}

// Tells you which of the built-in accounts a given account is.
function whichAccountIs(test) {
    for (let i = 0; i < 10; i++) {
        if (accounts[i] === test) {
            console.log(('Account is account' + i).replace('account0', 'owner'));
            return;
        }
        console.log('Account \'' + test + '\' is not one of the 10 given test accounts!');
    }
}


// =====================================================================================================================
// === Test definitions for the test suite
// =====================================================================================================================

if (!RUN_ALL_TESTS)
    console.log(colors.blue('Not all tests were be run! Please set RUN_ALL_TESTS = true first to run every test.'));

describe('BuyzookaToken', () => {
    const ONE_MILLION = 1000000;
    const HUNDRED_MILLION = 100 * ONE_MILLION;
    const TOTAL_SUPPLY = 1 * HUNDRED_MILLION;
    const WEI_DECIMALS = 18;
    const WEI = 10 ** WEI_DECIMALS;
    const WEI_ZEROES = '000000000000000000';

    const THOUSAND_YEARS_DAYS = 365243;       // See https://www.timeanddate.com/date/durationresult.html?m1=1&d1=1&y1=2000&m2=1&d2=1&y2=3000
    const TEN_YEARS_DAYS = Math.floor(THOUSAND_YEARS_DAYS / 100);
    const SECONDS_PER_DAY = 24 * 60 * 60;     // 86400 seconds in a day
    const JAN_1_2000_SECONDS = 946684800;     // Saturday, January 1, 2000 0:00:00 (GMT) (see https://www.epochconverter.com/)
    const JAN_1_2000_DAYS = JAN_1_2000_SECONDS / SECONDS_PER_DAY;
    const JAN_1_3000_DAYS = JAN_1_2000_DAYS + THOUSAND_YEARS_DAYS;

    const TODAY_SECONDS = new Date().getTime() / 1000;
    const TODAY_DAYS = Math.floor(TODAY_SECONDS / SECONDS_PER_DAY);

    // Gas amounts
    const GRANTGAS = 200000;        // was 140000, then 155000. Increased after splitting vesting out of grant.
    const UNIFORMGRANTGAS = 160000;
    const XFEROWNERGAS = 100000;
    const REVOKEONGAS = 170000;
    const VESTASOFGAS = 30000;

    // Create our test results checker object
    const result = new require('./util/test-result')();


    // ================================================================================
    // === Internal utilities
    // ================================================================================

    const checkAreEqual = result.checkValuesAreEqual;
    const checkAreNotEqual = result.checkValuesAreNotEqual;

    // Rounds irrational numbers to a whole token by truncation (rounding down), which matches the behavior of
    // Solidity integer math (especially division). This accommodates rounding up of very tiny decimals short of
    // a whole token without rounding up.
    function round(amountIn) {
        let amount = amountIn;
        amount = amount / WEI;
        let result = Math.floor(Math.floor(amount * 10 + 1) / 10);
        result = tokensToWei(result);
        if (log) console.log('  round: ' + amountIn + ' -> ' + result);
        return result;
    }

    // Equality check with minimal wiggle room for JS's limited floating point precision
    function checkAreEqualR(val1, val2) {
        return checkAreEqual(round(val1), round(val2));
    }

    function cleanLeadingZeroes(str) {
        assert(str !== undefined && str !== null);
        if (typeof str === 'number')
            return str;
        str = str.toString();
        let pos = 0;
        while (str.charAt(pos) === '0' && pos < str.length - 1)
            pos++;
        return str.substring(pos);
    }

    function tokensToWei(wholeTokensIn) {
        let wholeTokens = Math.floor(wholeTokensIn);
        let result = wholeTokens == 0 ? 0 : wholeTokens + WEI_ZEROES;
        if (log) console.log('  tokensToWei: ' + wholeTokensIn + ' -> ' + result);
        return result;
    }

    function weiToTokens(weiAmount) {
        let result = 0;
        let strResult = weiAmount.toString();
        if (strResult.length <= WEI_DECIMALS)
            result = 0;
        else {
            strResult = strResult.substring(0, result.length - WEI_DECIMALS);       // Lop off 18 zeroes from long string value
            if (log) console.log('   strResult', strResult);
            if (strResult.length === 0)
                result = 0;
            else
                result = parseInt(strResult);
        }
        if (log) console.log('  weiToTokens: ' + weiAmount + ' -> ' + result);
        return result;
    }

    let unexpectedErrors = 0;

    function catcher(error) {
        unexpectedErrors++;
        console.log('Unexpected error', error);
    }

    const DEFAULT_ERROR = 'revert';
    let expectedFails = 0;

    // Wrap your async call with this if you expect it to fail. Enables you to implement a test where
    // not failing is the unexpected case. The result will be true if the incoming send method result failed.
    async function expectFail(resultPromise, expectedMessage) {
        // // Handle boolean success/fail input.M
        // if (resultPromise === true || resultPromise === false) {
        //     if (!!expectedMessage)
        //         console.log(colors.yellow('Warning: Expected message '+expectedMessage+' not applicable to boolean result.'))
        //     return (!resultPromise);
        // }

        // Otherwise, handle Promise success/fail input.
        if (!expectedMessage)
            expectedMessage = DEFAULT_ERROR;

        let outcome = false;
        try {
            let unexpectedSuccess = await resultPromise;
            if (unexpectedSuccess)
                throw 'Expected method to fail but it was successful!';
            const errorMsg = (!expectedMessage ? '' : ('Expected ' + expectedMessage + ': ')) + 'No exception was thrown! (incorrect)';
            result.fail(errorMsg);
            outcome = false;
        } catch (error) {
            if (typeof error === 'string')
                throw error;
            const failedAsExpected = error.message.indexOf(expectedMessage) >= 0;
            if (failedAsExpected) {
                expectedFails++;
            } else {
                const errorMsg = "Expected '" + expectedMessage + "' exception but got '" + error.message + "' instead! (incorrect)";
                result.fail(errorMsg);
            }
            outcome = failedAsExpected;
        }
        return outcome;
    }

    async function subtest(caption, fn) {
        // Display sub-tests within tests in the build output.
        console.log(colors.grey('    - subtest ' + caption));
        await fn();
    }


    // ================================================================================
    // === Test basic attributes of the BuyzookaToken token
    // ================================================================================
    it('0. verify successful compilation/deploymement of BuyzookaToken', () => {
        checkAreNotEqual(BuyzookaToken, null, "BuyzookaToken is null. Did compile fail? Did deploy fail? Was there a problem with the constructor? Try setting RUN_ALL_TESTS = false.");
    });

    if (runThisTest())
        it('1. verified deployment of the BuyzookaToken contract by confirming it has a contract address', () => {
            if (!BuyzookaToken) return;
            checkAreNotEqual(BuyzookaToken.options.address, null);
        });

    if (runThisTest())
        it('2. verified BuyzookaToken has symbol BZOO', async () => {
            if (!BuyzookaToken) return;
            result.set(await BuyzookaToken.methods.symbol().call());
            result.checkIsEqual('BZOO');
        });

    if (runThisTest())
        it('3. verified BuyzookaToken has 18 decimals', async () => {
            if (!BuyzookaToken) return;
            result.set(await BuyzookaToken.methods.decimals().call());
            result.checkIsEqual(WEI_DECIMALS);
        });

    if (runThisTest())
        it('4. verified BuyzookaToken owner account and total supply initially have 100 million tokens', async () => {
            if (!BuyzookaToken) return;
            result.set(await BuyzookaToken.methods.balanceOf(owner).call());
            result.checkIsEqual(tokensToWei(TOTAL_SUPPLY));
            result.set(await BuyzookaToken.methods.totalSupply().call());
            result.checkIsEqual(tokensToWei(TOTAL_SUPPLY));
        });

    if (runThisTest())
        it('5. verified BuyzookaToken non-owner account initially has zero tokens', async () => {
            if (!BuyzookaToken) return;
            result.set(await BuyzookaToken.methods.balanceOf(account1).call());
            result.checkIsEqual(0);
        });


    // ================================================================================
    // === Test ownership functionality
    // ================================================================================
    if (runThisTest())
        it('6. verified only owner account effectively owns the contract', async () => {
            if (!BuyzookaToken) return;

            await subtest('owner of contract', async () => {
                result.set(await BuyzookaToken.methods.owner().call());
                result.checkIsEqual(owner);
            }).catch(catcher);

            await subtest('6a. account0 is owner, others are not.', async () => {
                result.set(await BuyzookaToken.methods.isOwner().call());
                result.checkIsTrue();
                result.set(await BuyzookaToken.methods.isOwner().call({from: account1}));
                result.checkIsFalse();
                result.set(await BuyzookaToken.methods.isOwner().call({from: account2}));
                result.checkIsFalse();
            }).catch(catcher);
        });

    // ================================================================================
    // === Test ERC20 basics
    // ================================================================================
    if (runThisTest())
        it('10. verified ERC20 transfer()', async () => {
            if (!BuyzookaToken) return;

            await subtest('10a. transfer owner->account1, then verify balances', async () => {
                result.set(await BuyzookaToken.methods.transfer(account1, tokensToWei(10000)).send({from: owner}));
                result.checkTransactionOk();
                // .
                result.set(await BuyzookaToken.methods.balanceOf(owner).call());
                result.checkIsEqual(tokensToWei(TOTAL_SUPPLY - 10000));
                result.set(await BuyzookaToken.methods.balanceOf(account1).call());
                result.checkIsEqual(tokensToWei(10000));
            }).catch(catcher);

            await subtest('10b. make transfer account1->account2, then verify balances', async () => {
                result.set(await BuyzookaToken.methods.transfer(account2, tokensToWei(1000)).send({from: account1}));
                result.checkTransactionOk();
                // Verify new balances.
                result.set(await BuyzookaToken.methods.balanceOf(account1).call());
                result.checkIsEqual(tokensToWei(9000));
                result.set(await BuyzookaToken.methods.balanceOf(account2).call());
                result.checkIsEqual(tokensToWei(1000));
            }).catch(catcher);

            await subtest('10c. trying to transfer more tokens than the balance will fail', async () => {
                result.set(await expectFail(BuyzookaToken.methods.transfer(account2, tokensToWei(999999)).send({from: account1})).catch(catcher));
                result.checkDidFail();
                // Verify nothing changed.
                result.set(await BuyzookaToken.methods.balanceOf(account1).call());
                result.checkIsEqual(tokensToWei(9000));
                result.set(await BuyzookaToken.methods.balanceOf(account2).call());
                result.checkIsEqual(tokensToWei(1000));
            }).catch(catcher);

            await subtest('10d. smaller transfer succeeds after first failed transfer', async () => {
                result.set(await BuyzookaToken.methods.transfer(account2, tokensToWei(9000)).send({from: account1}));
                result.checkTransactionOk();
                // Verify new balances.
                result.set(await BuyzookaToken.methods.balanceOf(account1).call());
                result.checkIsEqual(0);
                result.set(await BuyzookaToken.methods.balanceOf(account2).call());
                result.checkIsEqual(tokensToWei(10000));
            }).catch(catcher);
        });

    // --------------------------------------------------------------------------------
    // Use the 'approve/transfer' method to transfer funds.
    async function approveThenTransferFunds(from, to, amount) {
        // In the 'from' account, approve 'to' to be able to take funds.
        result.set(await BuyzookaToken.methods.approve(to, amount).send({from: from}));
        result.checkTransactionOk('approveThenTransferFunds(): approve failed');
        // Transfer approved funds 'from' -> 'to'.
        result.set(await BuyzookaToken.methods.transferFrom(from, to, amount).send({from: to}));
        result.checkTransactionOk('approveThenTransferFunds(): transferFrom failed');
    }

    if (runThisTest())
        it('11. verified ERC20 transfer/approve method', async () => {
            if (!BuyzookaToken) return;

            await subtest('11a. transfer owner->account1, then verify balances', async () => {
                await approveThenTransferFunds(owner, account1, tokensToWei(10000));
                // Verify new balances.
                result.set(await BuyzookaToken.methods.balanceOf(owner).call());
                result.checkIsEqual(tokensToWei(TOTAL_SUPPLY - 10000));
                result.set(await BuyzookaToken.methods.balanceOf(account1).call());
                result.checkIsEqual(tokensToWei(10000));
                // Verify allowances
                result.set(await BuyzookaToken.methods.allowance(owner, account1).call());
                result.checkIsEqual(0);
                result.set(await BuyzookaToken.methods.allowance(account1, owner).call());
                result.checkIsEqual(0);
            }).catch(catcher);

            await subtest('11b. make transfer account1->account2, then verify balances', async () => {
                await approveThenTransferFunds(account1, account2, tokensToWei(1000));
                // Verify new balances.
                result.set(await BuyzookaToken.methods.balanceOf(account1).call());
                result.checkIsEqual(tokensToWei(9000));
                result.set(await BuyzookaToken.methods.balanceOf(account2).call());
                result.checkIsEqual(tokensToWei(1000));
                // Verify allowances
                result.set(await BuyzookaToken.methods.allowance(account1, account2).call());
                result.checkIsEqual(0);
                result.set(await BuyzookaToken.methods.allowance(account2, account1).call());
                result.checkIsEqual(0);
            }).catch(catcher);

            await subtest('11c. trying to transfer more tokens than the balance will fail', async () => {
                result.set(await expectFail(approveThenTransferFunds(account1, account2, tokensToWei(999999))).catch(catcher));
                result.checkDidFail();
                // Revoke the failed approval
                await BuyzookaToken.methods.approve(account2, 0).send({from: account1});
                // Verify nothing changed.
                result.set(await BuyzookaToken.methods.balanceOf(account1).call());
                result.checkIsEqual(tokensToWei(9000));
                result.set(await BuyzookaToken.methods.balanceOf(account2).call());
                result.checkIsEqual(tokensToWei(1000));
                // Verify allowances
                result.set(await BuyzookaToken.methods.allowance(account1, account2).call());
                result.checkIsEqual(0);
                result.set(await BuyzookaToken.methods.allowance(account2, account1).call());
                result.checkIsEqual(0);
            }).catch(catcher);

            await subtest('11d. smaller transfer succeeds after prior failed transfer', async () => {
                await approveThenTransferFunds(account1, account2, tokensToWei(9000));
                // Verify new balances.
                result.set(await BuyzookaToken.methods.balanceOf(account1).call());
                result.checkIsEqual(0);
                result.set(await BuyzookaToken.methods.balanceOf(account2).call());
                result.checkIsEqual(tokensToWei(10000));
                // Verify allowances
                result.set(await BuyzookaToken.methods.allowance(account1, account1).call());
                result.checkIsEqual(0);
                result.set(await BuyzookaToken.methods.allowance(account2, account1).call());
                result.checkIsEqual(0);
            }).catch(catcher);
        });

    // --------------------------------------------------------------------------------
    if (runThisTest())
        it('12. verified transferFrom() fails without prior approval', async () => {
            if (!BuyzookaToken) return;

            await subtest('12a. account1 can\'t transfer from owner to account2', async () => {
                result.set(await expectFail(BuyzookaToken.methods.transferFrom(owner, account2, tokensToWei(5 * ONE_MILLION)).send({from: account1})).catch(catcher));
                result.checkDidFail();
            }).catch(catcher);

            await subtest('12b. owner can\'t transfer from account1 to account2', async () => {
                result.set(await expectFail(BuyzookaToken.methods.transferFrom(account1, account2, tokensToWei(5 * ONE_MILLION)).send({from: owner})).catch(catcher));
                result.checkDidFail();
            }).catch(catcher);

            await subtest('12c. owner can\'t transfer from owner to account1', async () => {
                result.set(await expectFail(BuyzookaToken.methods.transferFrom(owner, account1, tokensToWei(5 * ONE_MILLION)).send({from: owner})).catch(catcher));
                result.checkDidFail();
            }).catch(catcher);

            await subtest('12d. owner can\'t transfer from owner to owner', async () => {
                result.set(await expectFail(BuyzookaToken.methods.transferFrom(owner, owner, tokensToWei(5 * ONE_MILLION)).send({from: owner})).catch(catcher));
                result.checkDidFail();
            }).catch(catcher);
        });

    // --------------------------------------------------------------------------------
    if (runThisTest())
        it('13. burn tokens', async () => {
            if (!BuyzookaToken) return;

            await subtest('13a. check initial total supply', async () => {
                result.set(await BuyzookaToken.methods.totalSupply().call());
                result.checkIsEqual(tokensToWei(TOTAL_SUPPLY));
            }).catch(catcher);

            let remainingSupply = TOTAL_SUPPLY;

            await subtest('13b. non-owner can burn own tokens.', async () => {
                // Transfer 100M to account 1
                result.set(await BuyzookaToken.methods.transfer(account1, tokensToWei(100 * ONE_MILLION)).send({from: owner}));
                result.checkTransactionOk();
                result.set(await BuyzookaToken.methods.balanceOf(account1).call());
                result.checkIsEqual(tokensToWei(100 * ONE_MILLION));
                // Try to burn 40M from account 1
                result.set(await BuyzookaToken.methods.burn(tokensToWei(40 * ONE_MILLION)).send({from: account1}));
                result.checkTransactionOk();
                // Confirm tokens are gone
                result.set(await BuyzookaToken.methods.balanceOf(account1).call());
                result.checkIsEqual(tokensToWei(100 * ONE_MILLION - 40 * ONE_MILLION));
                // Check impact on total supply
                remainingSupply -= 40 * ONE_MILLION;
                result.set(await BuyzookaToken.methods.totalSupply().call());
                result.checkIsEqual(tokensToWei(remainingSupply));
            }).catch(catcher);

            // At this point, 0 tokens have left owner wallet.
            await subtest('13c. owner can burn own tokens', async () => {
                // Transfer 10M from account 1 to owner
                result.set(await BuyzookaToken.methods.transfer(owner, tokensToWei(10 * ONE_MILLION)).send({from: account1}));
                result.checkTransactionOk();
                result.set(await BuyzookaToken.methods.balanceOf(owner).call());
                result.checkIsEqual(tokensToWei(10 * ONE_MILLION));
                result.set(await BuyzookaToken.methods.totalSupply().call());
                result.checkIsEqual(tokensToWei(remainingSupply));
                // Try to burn 10M from owner
                result.set(await BuyzookaToken.methods.burn(tokensToWei(10 * ONE_MILLION)).send({from: owner}));
                result.checkTransactionOk();
                // Confirm tokens are gone
                result.set(await BuyzookaToken.methods.balanceOf(owner).call());
                result.checkIsEqual(tokensToWei(TOTAL_SUPPLY - 100 * ONE_MILLION));
                // Check impact on total supply
                remainingSupply -= 10 * ONE_MILLION;
                result.set(await BuyzookaToken.methods.totalSupply().call());
                result.checkIsEqual(tokensToWei(remainingSupply));
            }).catch(catcher);
        });

    
    // ================================================================================
    // === Last: Summary
    // ================================================================================
    it('Display build results summary', async () => {
        if (!BuyzookaToken) {
            console.log(colors.blue('==> All tests were skipped! Please check the following:\n  - Did the build fail?\n  - Did it run out of gas when deployed?\n  - Check that all interface methods have an implementation (build success without deployment).'));
        } else {
            const results = result.getResults();
            const attempts = results[0];
            const successes = results[1];
            const failures = (attempts - successes) - expectedFails;
            if (attempts === 0)
                console.log(colors.yellow('==> No checks were made by any test.'));
            else if (failures > 0)
                console.log(colors.red('==> Out of ' + attempts + ' checks, ' + failures + ' failed!'));
            else
                console.log(colors.green('==> All ' + attempts + ' checks were successful.'));

            if (unexpectedErrors > 0)
                console.log(colors.red('==> FAILURE: ' + unexpectedErrors + ' uncaught exception(s)! (see above)'));
        }
    });
});
