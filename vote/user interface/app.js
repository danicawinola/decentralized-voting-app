document.addEventListener('DOMContentLoaded', () => {
  const connectedAccountDiv = document.getElementById('connectedAccount');
  const totalCandidatesDiv = document.getElementById('totalCandidates');
  const totalVotesDiv = document.getElementById('totalVotes');
  const votingStatusDiv = document.getElementById('votingStatus');

  const addCandidateBtn = document.getElementById('addCandidateBtn');
  const candidateNameInput = document.getElementById('candidateName');
  const addCandidateMessage = document.getElementById('addCandidateMessage');

  const refreshListBtn = document.getElementById('refreshListBtn');
  const candidateListDiv = document.getElementById('candidateList');
  const voteMessage = document.getElementById('voteMessage');

  const candidateIdInput = document.getElementById('candidateIdInput');
  const getDetailsBtn = document.getElementById('getDetailsBtn');
  const candidateDetailsDiv = document.getElementById('candidateDetails');

  let currentAccount = null;

  const contractAddress = "0x22b68665B9416d510907BF8C056107E97c61Ab00";
  const abi = [
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_name",
				"type": "string"
			}
		],
		"name": "addCandidate",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_candidateId",
				"type": "uint256"
			}
		],
		"name": "vote",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "candidates",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "name",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "voteCount",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "candidatesCount",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_id",
				"type": "uint256"
			}
		],
		"name": "getCandidate",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "hasVoted",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
]
  let web3;
  let contract;

  async function initializeWeb3() {
    if (window.ethereum) {
      web3 = new Web3(window.ethereum);
      contract = new web3.eth.Contract(abi, contractAddress);
      console.log('Contract methods:', Object.keys(contract.methods));
      try {
        const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
        currentAccount = accounts[0];
        connectedAccountDiv.textContent = truncateAddress(currentAccount);
        await updateVotingStatus();
      } catch (error) {
        connectedAccountDiv.textContent = 'Not connected';
        currentAccount = null;
        votingStatusDiv.textContent = 'Not Voted';
        votingStatusDiv.className = 'value not-voted';
      }
    } else {
      alert('Please install MetaMask or another Ethereum wallet extension.');
    }
  }

  function truncateAddress(address) {
    if (!address) return '';
    return address.slice(0, 6) + '...' + address.slice(-4);
  }

  async function updateVotingStatus() {
    if (!currentAccount) {
      votingStatusDiv.textContent = 'Not Voted';
      votingStatusDiv.className = 'value not-voted';
      return;
    }
    try {
      const hasVoted = await contract.methods.hasVoted(currentAccount).call();
      if (hasVoted) {
        votingStatusDiv.textContent = 'Voted';
        votingStatusDiv.className = 'value';
      } else {
        votingStatusDiv.textContent = 'Not Voted';
        votingStatusDiv.className = 'value not-voted';
      }
    } catch (error) {
      votingStatusDiv.textContent = 'Unknown';
      votingStatusDiv.className = 'value not-voted';
    }
  }

  async function updateTotalCandidates() {
    try {
      const count = await contract.methods.candidatesCount().call();
      totalCandidatesDiv.textContent = count;
    } catch (error) {
      totalCandidatesDiv.textContent = 'Error';
    }
  }

  async function updateTotalVotes() {
    try {
      const count = await contract.methods.candidatesCount().call();
      let totalVotes = 0;
      for (let i = 1; i <= count; i++) {
        const c = await contract.methods.getCandidate(i).call();
        totalVotes += parseInt(c[2]);
      }
      totalVotesDiv.textContent = totalVotes;
    } catch (error) {
      totalVotesDiv.textContent = 'Error';
    }
  }

  addCandidateBtn.addEventListener('click', async () => {
    const name = candidateNameInput.value.trim();
    if (!name) {
      addCandidateMessage.textContent = 'Candidate name cannot be empty.';
      addCandidateMessage.style.color = '#dc3545';
      return;
    }
    addCandidateMessage.textContent = '';
    addCandidateBtn.disabled = true;
    addCandidateBtn.classList.add('loading');
    addCandidateBtn.innerHTML = '<div class="spinner"></div> Adding...';
    try {
      await contract.methods.addCandidate(name).send({ from: currentAccount });
      addCandidateMessage.textContent = 'Candidate added successfully.';
      addCandidateMessage.style.color = '#198754';
      candidateNameInput.value = '';
      await loadCandidateList();
      await updateTotalCandidates();
    } catch (error) {
      addCandidateMessage.textContent = 'Error adding candidate: ' + error.message;
      addCandidateMessage.style.color = '#dc3545';
    }
    addCandidateBtn.disabled = false;
    addCandidateBtn.classList.remove('loading');
    addCandidateBtn.textContent = 'Add Candidate';
  });

  async function loadCandidateList() {
    candidateListDiv.innerHTML = '';
    voteMessage.textContent = '';
    try {
      const count = await contract.methods.candidatesCount().call();
      if (!count || count == 0) {
        candidateListDiv.innerHTML = `
          <div class="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
            <div>No candidates yet</div>
            <div>Add a candidate to get started</div>
          </div>`;
        return;
      }
      for (let i = 1; i <= count; i++) {
        const c = await contract.methods.getCandidate(i).call();
        if (!c || !c[0]) continue;
        const candidateItem = document.createElement('div');
        candidateItem.className = 'candidate-item';

        const infoDiv = document.createElement('div');
        infoDiv.className = 'candidate-info';

        const nameDiv = document.createElement('div');
        nameDiv.className = 'candidate-name';
        nameDiv.textContent = c[1];

        const idDiv = document.createElement('div');
        idDiv.className = 'candidate-id';
        idDiv.textContent = 'ID: ' + c[0];

        infoDiv.appendChild(nameDiv);
        infoDiv.appendChild(idDiv);

        const voteCountDiv = document.createElement('div');
        voteCountDiv.className = 'vote-count';
        voteCountDiv.textContent = c[2] + ' votes';

        const voteBtn = document.createElement('button');
        voteBtn.className = 'btn-primary';
        voteBtn.textContent = 'Vote';
        voteBtn.onclick = async () => {
          voteMessage.textContent = '';
          try {
            const hasVoted = await contract.methods.hasVoted(currentAccount).call();
            if (hasVoted) {
              voteMessage.textContent = 'You have already voted.';
              voteMessage.style.color = '#dc3545';
              return;
            }
            await contract.methods.vote(c[0]).send({ from: currentAccount });
            voteMessage.textContent = 'Vote cast successfully.';
            voteMessage.style.color = '#198754';
            await loadCandidateList();
            await updateVotingStatus();
            if (candidateIdInput.value == c[0]) {
              getCandidateDetails();
            }
            await updateTotalVotes();
          } catch (error) {
            voteMessage.textContent = 'Error voting: ' + error.message;
            voteMessage.style.color = '#dc3545';
          }
        };

        candidateItem.appendChild(infoDiv);
        candidateItem.appendChild(voteCountDiv);
        candidateItem.appendChild(voteBtn);

        candidateListDiv.appendChild(candidateItem);
      }
    } catch (error) {
      candidateListDiv.textContent = 'Error loading candidates: ' + error.message;
      candidateListDiv.style.color = '#dc3545';
    }
  }

  getDetailsBtn.addEventListener('click', async () => {
    const id = candidateIdInput.value;
    candidateDetailsDiv.innerHTML = '';
    if (!id || id < 1) {
      candidateDetailsDiv.textContent = 'Please enter a valid candidate ID.';
      candidateDetailsDiv.style.color = '#dc3545';
      return;
    }
    try {
      const candidate = await contract.methods.getCandidate(id).call();
      if (candidate[0] == 0) {
        candidateDetailsDiv.textContent = 'Candidate not found.';
        candidateDetailsDiv.style.color = '#dc3545';
        return;
      }
      const detailsHtml = `
        <div style="border: 1px solid #d6cfff; border-radius: 6px; padding: 15px; background: #f8f7ff;">
          <strong>Candidate #${candidate[0]}</strong><br/>
          Name: ${candidate[1]}<br/>
          Votes: ${candidate[2]}<br/>
          <button id="voteDetailBtn" class="btn-primary" style="margin-top: 10px;">Vote for this Candidate</button>
        </div>
      `;
      candidateDetailsDiv.innerHTML = detailsHtml;

      document.getElementById('voteDetailBtn').onclick = async () => {
        voteMessage.textContent = '';
        try {
          const hasVoted = await contract.methods.hasVoted(currentAccount).call();
          if (hasVoted) {
            voteMessage.textContent = 'You have already voted.';
            voteMessage.style.color = '#dc3545';
            return;
          }
          await contract.methods.vote(candidate[0]).send({ from: currentAccount });
          voteMessage.textContent = 'Vote cast successfully.';
          voteMessage.style.color = '#198754';
          await loadCandidateList();
          await updateVotingStatus();
          getCandidateDetails();
          await updateTotalVotes();
        } catch (error) {
          voteMessage.textContent = 'Error voting: ' + error.message;
          voteMessage.style.color = '#dc3545';
        }
      };
    } catch (error) {
      candidateDetailsDiv.textContent = 'Error fetching candidate details: ' + error.message;
      candidateDetailsDiv.style.color = '#dc3545';
    }
  });

  async function getCandidateDetails() {
    const id = candidateIdInput.value;
    if (!id || id < 1) {
      candidateDetailsDiv.textContent = 'Please enter a valid candidate ID.';
      candidateDetailsDiv.style.color = '#dc3545';
      return;
    }
    try {
      const candidate = await contract.methods.getCandidate(id).call();
      if (candidate[0] == 0) {
        candidateDetailsDiv.textContent = 'Candidate not found.';
        candidateDetailsDiv.style.color = '#dc3545';
        return;
      }
      const detailsHtml = `
        <div style="border: 1px solid #d6cfff; border-radius: 6px; padding: 15px; background: #f8f7ff;">
          <strong>Candidate #${candidate[0]}</strong><br/>
          Name: ${candidate[1]}<br/>
          Votes: ${candidate[2]}<br/>
          <button id="voteDetailBtn" class="btn-primary" style="margin-top: 10px;">Vote for this Candidate</button>
        </div>
      `;
      candidateDetailsDiv.innerHTML = detailsHtml;

      document.getElementById('voteDetailBtn').onclick = async () => {
        voteMessage.textContent = '';
        try {
          const hasVoted = await contract.methods.hasVoted(currentAccount).call();
          if (hasVoted) {
            voteMessage.textContent = 'You have already voted.';
            voteMessage.style.color = '#dc3545';
            return;
          }
          await contract.methods.vote(candidate[0]).send({ from: currentAccount });
          voteMessage.textContent = 'Vote cast successfully.';
          voteMessage.style.color = '#198754';
          await loadCandidateList();
          await updateVotingStatus();
          getCandidateDetails();
          await updateTotalVotes();
        } catch (error) {
          voteMessage.textContent = 'Error voting: ' + error.message;
          voteMessage.style.color = '#dc3545';
        }
      };
    } catch (error) {
      candidateDetailsDiv.textContent = 'Error fetching candidate details: ' + error.message;
      candidateDetailsDiv.style.color = '#dc3545';
    }
  }

  refreshListBtn.addEventListener('click', async () => {
    refreshListBtn.disabled = true;
    await loadCandidateList();
    refreshListBtn.disabled = false;
  });

  // Initialize
  initializeWeb3().then(() => {
    updateTotalCandidates();
    updateTotalVotes();
    loadCandidateList();
  });

  // Listen for account changes
  if (window.ethereum) {
    window.ethereum.on('accountsChanged', async (accounts) => {
      currentAccount = accounts[0] || null;
      connectedAccountDiv.textContent = currentAccount ? truncateAddress(currentAccount) : 'Not connected';
      await updateVotingStatus();
    });
  }
});
