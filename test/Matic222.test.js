const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Matic222 Token Contract", function () {
  let Matic222;
  let matic222;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  let initialSupply;

  beforeEach(async function () {
    Matic222 = await ethers.getContractFactory("Matic222");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    // Set initialSupply to 1,000,000 tokens (accounting for decimals)
    initialSupply = ethers.parseEther("1000000"); // Updated to newer ethers v6 syntax
    matic222 = await Matic222.deploy(1000000); // Pass raw number since contract handles decimals
  });

  describe("Deployment", function () {
    it("Should set the correct token name", async function () {
      expect(await matic222.name()).to.equal("matic222");
    });

    it("Should set the correct token symbol", async function () {
      expect(await matic222.symbol()).to.equal("MT222");
    });

    it("Should set the correct decimals", async function () {
      expect(await matic222.decimals()).to.equal(18);
    });

    it("Should assign the total supply of tokens to the owner", async function () {
      const ownerBalance = await matic222.balanceOf(owner.address);
      const totalSupply = await matic222.totalSupply();
      expect(totalSupply).to.equal(ownerBalance);
      expect(ownerBalance).to.equal(initialSupply);
    });

    it("Should correctly convert initialSupply parameter to token units", async function () {
      const totalSupply = await matic222.totalSupply();
      expect(totalSupply).to.equal(initialSupply);
    });
  });

  describe("Transactions", function () {
    it("Should transfer tokens between accounts", async function () {
      // Transfer 50 tokens from owner to addr1
      const transferAmount = ethers.parseEther("50");
      await expect(matic222.transfer(addr1.address, transferAmount))
        .to.emit(matic222, "Transfer")
        .withArgs(owner.address, addr1.address, transferAmount);

      const addr1Balance = await matic222.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(transferAmount);

      // Transfer 50 tokens from addr1 to addr2
      await expect(matic222.connect(addr1).transfer(addr2.address, transferAmount))
        .to.emit(matic222, "Transfer")
        .withArgs(addr1.address, addr2.address, transferAmount);

      const addr2Balance = await matic222.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(transferAmount);
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const initialOwnerBalance = await matic222.balanceOf(owner.address);

      // Try to send 1 token from addr1 (0 tokens) to owner
      await expect(
        matic222.connect(addr1).transfer(owner.address, 1)
      ).to.be.reverted;

      // Owner balance shouldn't have changed
      expect(await matic222.balanceOf(owner.address)).to.equal(
        initialOwnerBalance
      );
    });

    it("Should update balances after transfers", async function () {
      const initialOwnerBalance = await matic222.balanceOf(owner.address);

      // Transfer 100 tokens from owner to addr1
      const transferAmount1 = ethers.parseEther("100");
      await matic222.transfer(addr1.address, transferAmount1);

      // Transfer another 50 tokens from owner to addr2
      const transferAmount2 = ethers.parseEther("50");
      await matic222.transfer(addr2.address, transferAmount2);

      // Check balances
      const finalOwnerBalance = await matic222.balanceOf(owner.address);
      expect(finalOwnerBalance).to.equal(
        initialOwnerBalance - transferAmount1 - transferAmount2
      );

      const addr1Balance = await matic222.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(transferAmount1);

      const addr2Balance = await matic222.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(transferAmount2);
    });
  });

  describe("Allowance", function () {
    it("Should approve tokens for delegated transfer", async function () {
      const approveAmount = ethers.parseEther("100");
      await expect(matic222.approve(addr1.address, approveAmount))
        .to.emit(matic222, "Approval")
        .withArgs(owner.address, addr1.address, approveAmount);

      expect(await matic222.allowance(owner.address, addr1.address)).to.equal(
        approveAmount
      );
    });

    it("Should transfer tokens with transferFrom", async function () {
      const transferAmount = ethers.parseEther("50");

      // Owner approves addr1 to spend 50 tokens
      await matic222.approve(addr1.address, transferAmount);

      // Addr1 transfers 50 tokens from owner to addr2
      await expect(
        matic222.connect(addr1).transferFrom(
          owner.address,
          addr2.address,
          transferAmount
        )
      )
        .to.emit(matic222, "Transfer")
        .withArgs(owner.address, addr2.address, transferAmount);

      // Check allowance was reduced
      expect(
        await matic222.allowance(owner.address, addr1.address)
      ).to.equal(0);

      // Check balances
      expect(await matic222.balanceOf(addr2.address)).to.equal(transferAmount);
    });

    it("Should fail transferFrom if allowance is insufficient", async function () {
      const transferAmount = ethers.parseEther("100");

      // Owner approves addr1 to spend 50 tokens
      await matic222.approve(addr1.address, ethers.parseEther("50"));

      // Try to transfer 100 tokens (more than allowance)
      await expect(
        matic222.connect(addr1).transferFrom(
          owner.address,
          addr2.address,
          transferAmount
        )
      ).to.be.reverted;
    });

    it("Should fail transferFrom if balance is insufficient", async function () {
      const ownerBalance = await matic222.balanceOf(owner.address);
      const transferAmount = ownerBalance + 1n; // Using BigInt arithmetic

      // Owner approves addr1 to spend all tokens + 1
      await matic222.approve(addr1.address, transferAmount);

      // Try to transfer more than owner has
      await expect(
        matic222.connect(addr1).transferFrom(
          owner.address,
          addr2.address,
          transferAmount
        )
      ).to.be.reverted;
    });
  });

  describe("Edge Cases", function () {
    it("Should handle zero value transfers", async function () {
      // Transfer 0 tokens from owner to addr1
      await expect(matic222.transfer(addr1.address, 0))
        .to.emit(matic222, "Transfer")
        .withArgs(owner.address, addr1.address, 0);

      // Check balances remain the same
      const ownerBalance = await matic222.balanceOf(owner.address);
      expect(ownerBalance).to.equal(initialSupply);

      const addr1Balance = await matic222.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(0);
    });

    it("Should handle maximum uint256 value", async function () {
      const maxUint256 = ethers.MaxUint256;
      
      // Approve max uint256
      await matic222.approve(addr1.address, maxUint256);
      expect(await matic222.allowance(owner.address, addr1.address)).to.equal(maxUint256);

      // Transfer all tokens (which is less than maxUint256)
      const ownerBalance = await matic222.balanceOf(owner.address);
      await matic222.connect(addr1).transferFrom(
        owner.address,
        addr1.address,
        ownerBalance
      );

      // Check balances
      expect(await matic222.balanceOf(owner.address)).to.equal(0);
      expect(await matic222.balanceOf(addr1.address)).to.equal(ownerBalance);
    });
  });
});