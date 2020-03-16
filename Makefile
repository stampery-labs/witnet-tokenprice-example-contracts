deploy:
	@truffle migrate --network rinkeby

compile:
	@npm run compile

test:
	@truffle test

.PHONY: test compile deploy
