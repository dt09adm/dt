const games = {
  freefire: {
    name: 'Free Fire MAX',
    desc: 'Game sinh tồn bắn súng Battle Royale, tối đa 50 người chơi một trận, đồ hoạ mượt và tối ưu cho điện thoại tầm trung.',
    url: 'https://play.google.com/store/apps/details?id=com.dts.freefiremax',
  },
  lienquan: {
    name: 'Liên Quân Mobile',
    desc: 'Game đấu trường MOBA 5v5, chọn tướng, phối hợp cùng đồng đội để phá huỷ trụ và căn cứ của đối phương.',
    url: 'https://play.google.com/store/apps/details?id=com.garena.game.kgvn',
  },
  pubg: {
    name: 'PUBG Mobile',
    desc: 'Game sinh tồn bắn súng góc nhìn thứ nhất/thứ ba, 100 người chơi cùng tranh vị trí sống sót cuối cùng trên bản đồ rộng lớn.',
    url: 'https://play.google.com/store/apps/details?id=com.tencent.ig',
  },
};

const tiles = document.querySelectorAll('.game-tile');
const detailName = document.getElementById('detail-name');
const detailDesc = document.getElementById('detail-desc');
const downloadBtn = document.getElementById('download-btn');

tiles.forEach(tile => {
  tile.addEventListener('click', () => {
    tiles.forEach(t => t.classList.remove('active'));
    tile.classList.add('active');

    const game = games[tile.dataset.game];
    detailName.textContent = game.name;
    detailDesc.textContent = game.desc;
    downloadBtn.href = game.url;
  });
});
