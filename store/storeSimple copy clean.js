import { ref } from "vue";
const storeSimple = ref({
  musicList: [
    {
      title: "Universe",
      artist: "",
      cover: "https://vmusic.ir/wp-content/uploads/2024/08/Jurrivh-Universe-2024.jpg",
      audio: "https://dc.vmusic.ir/2024/08/Jurrivh - Universe (2024)/128k/01) Jurrivh - Universe.mp3",
      genre: "relax",
      duration: "00:2:03",
      is_active: true
    },
    {
      title: "Øneheart",
      artist: "",
      cover: "https://vmusic.ir/wp-content/uploads/2023/05/Oneheart-searching-for-you-2023.jpg",
      audio: "https://db.vmusic.ir/2023/05/Øneheart - searching for you (2023)/128k/Øneheart - searching for you.mp3",
      genre: "relax",
      duration: "00:1:39",
      is_active: true
    },
    {
      title: "You can get lost among good old movies",
      artist: "",
      cover: "https://vmusic.ir/wp-content/uploads/2024/08/Konstantin-Tyufyakin-Unnamed-2024.jpg",
      audio: "https://dc.vmusic.ir/2024/07/Konstantin Tyufyakin - Unnamed (2024)/128k/01) Konstantin Tyufyakin - You can get lost among good old movies.mp3",
      genre: "relax",
      duration: "00:2:25",
      is_active: true
    },
    {
      title: "Evolution",
      artist: "Interplay Records",
      cover: "https://vmusic.ir/wp-content/uploads/2024/07/Interplay-Records-Interplay-Radio-Episode-513-2024.jpg",
      audio: "https://dc.vmusic.ir/2024/07/Interplay Records - Interplay Radio Episode 513 (2024)/128k/03) Interplay Records - Evolution (Interplay 51).mp3",
      genre: "electronic trance",
      duration: "00:3:40",
      is_active: true
    },
    {
      title: "Atlantis",
      artist: "Interplay Records",
      cover: "https://vmusic.ir/wp-content/uploads/2024/07/Interplay-Records-Interplay-Radio-Episode-513-2024.jpg",
      audio: "https://dc.vmusic.ir/2024/07/Interplay Records - Interplay Radio Episode 513 (2024)/128k/04) Interplay Records - Atlantis (Interplay 513).mp3",
      genre: "electronic trance",
      duration: "00:3:04",
      is_active: true
    },
    {
      title: "Serotonin",
      artist: "Interplay Records",
      cover: "https://vmusic.ir/wp-content/uploads/2024/07/Interplay-Records-Interplay-Radio-Episode-513-2024.jpg",
      audio: "https://dc.vmusic.ir/2024/07/Interplay Records - Interplay Radio Episode 513 (2024)/128k/17) Interplay Records - Serotonin (Interplay 513).mp3",
      genre: "electronic trance",
      duration: "00:4:10",
      is_active: true
    },
    {
      title: "Hagelslag",
      artist: "Global DJ Broadcast Weekly Drive 31",
      cover: "https://vmusic.ir/wp-content/uploads/2024/08/Markus-Schulz-Global-DJ-Broadcast-Weekly-Drive-31-2024.jpg",
      audio: "https://dc.vmusic.ir/2024/07/Markus Schulz - Global DJ Broadcast Weekly Drive 31 (2024)/128k/02) ReOrder, First Effect - Hagelslag (GDJB Weekly Drive 31).mp3",
      genre: "electronic trance",
      duration: "",
      is_active: true
    },
    {
      title: "Atlantis",
      artist: "Tycoos",
      cover: "https://vmusic.ir/wp-content/uploads/2024/07/Tycoos-Future-Horizons-441-2024.jpg",
      audio: "https://dc.vmusic.ir/2024/07/Tycoos - Future Horizons 441 (2024)/128k/03) Tycoos - Atlantis (Future Horizons 441).mp3",
      genre: "electronic trance",
      duration: "",
      is_active: true
    },
    {
      title: "Doost Daram Zendegi ro",
      artist: "Sirvan",
      cover: "https://upmusics.com/wp-content/uploads/2017/07/Sirvan-Khosravi-Doost-Daram-Zendegiro.jpg",
      audio: "https://aod.musiciom.ir/Tracks/Songs/Sirvan%20Khosravi%20-%20Doost%20Daram%20Zendegiro%20(UpMusic).mp3?host=upmusics.com",
      genre: "pop",
      duration: "",
      is_active: true
    },
    {
      title: "Tanha Nazar",
      artist: "Sirvan",
      cover: "https://www.ganja2music.com/Image/Post/7.2019/Sirvan%20Khosravi%20-%20Tanha%20Nazar.jpg",
      audio: "https://irsv.upmusics.com/Downloads/Musics/Sirvan%20Khosravi%20%7C%20Tanha%20Nazar%20(320).mp3",
      genre: "pop electronic",
      duration: "",
      is_active: true
    },
    {
      title: "No Step On Wing",
      artist: "Nils Frahm",
      cover: "https://vmusic.ir/wp-content/uploads/2020/03/Nils-Frahm-Empty-2020.jpg",
      audio: "https://dl.vmusic.ir//2020/03/Nils Frahm - Empty (2020)/128k/03) Nils Frahm - No Step On Wing - 2020.mp3",
      genre: "relax piano ambient",
      duration: "",
      is_active: true
    },
    {
      title: "What I've Done",
      artist: "LinkinPark",
      cover: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ-yAY8vyC_ADH0A3tkOFqiDUBk5dVK3yUaRg&s",
      audio: "https://ememay.ir/wp-content/uploads/2024/04/Linkin-Park-What-Ive-Done.mp3",
      genre: "rock metal",
      duration: "",
      is_active: true
    },
    {
      title: "Breaking The Habit",
      artist: "LinkinPark",
      cover: "https://i1.sndcdn.com/artworks-000116080355-gatn8i-t500x500.jpg",
      audio: "https://dl.ememay.ir/Music/Linkin-Park/Papercuts/Breaking-the-Habit-Linkin-Park-320.mp3",
      genre: "rock metal",
      star: 5,
      duration: "",
      reference: "https://ememay.ir/",
      is_active: true
    },
    {
      title: "Buck dich",
      artist: "Rammstein",
      cover: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSIdCo_0hF5SiwaeLEhHVEbKs6rw3qGG-tePQ&s",
      audio: "https://ememay.ir/wp-content/uploads/2024/03/Rammstein-Buck-dich.mp3",
      genre: "rock metal",
      duration: "",
      is_active: true
    },
    {
      title: "In The End",
      artist: "LinkinPark",
      cover: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQYwGBA3Zch4vi2eD2aEH_Cq136VyvxSQHHDA&s",
      audio: "https://ememay.ir/wp-content/uploads/2024/04/Linkin-Park-In-the-End.mp3",
      genre: "rock",
      duration: "",
      is_active: true
    },
    {
      title: "Khanom Gol",
      artist: "Ebi",
      cover: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcThIfO_ydjF7ly2z_kVJOZt5ssTf1hODhSRuP-AS8eJGnTpOv5rFzP7ZpFzmIzrvwoXBbc&usqp=CAU",
      audio: "https://dl.shabamusic.com/Music/1402/09/19/Ebi - Khanom Gol (128).mp3",
      genre: "nostalgy",
      duration: "",
      is_active: true
    },
    {
      title: "You",
      artist: "Rostislav Khalikov",
      cover: "",
      audio: "https://dc.vmusic.ir/2024/07/Rostislav Khalikov - Waiting for a Miracle (2024)/128k/01) Rostislav Khalikov - You.mp3",
      genre: "relax piano",
      duration: "",
      is_active: true
    },
    {
      title: "Melody Box",
      artist: "Rostislav Khalikov",
      cover: "",
      audio: "https://dc.vmusic.ir/2024/07/Rostislav Khalikov - Waiting for a Miracle (2024)/128k/02) Rostislav Khalikov - Melody Box.mp3",
      genre: "relax piano",
      duration: "",
      is_active: true
    },
    {
      title: "Awakening",
      artist: "Rostislav Khalikov",
      cover: "",
      audio: "https://dc.vmusic.ir/2024/07/Rostislav Khalikov - Waiting for a Miracle (2024)/128k/03) Rostislav Khalikov - Awakening.mp3",
      genre: "relax piano",
      duration: "",
      is_active: true
    },
    {
      title: "Echo of First Love",
      artist: "Rostislav Khalikov",
      cover: "",
      audio: "https://dc.vmusic.ir/2024/07/Rostislav Khalikov - Waiting for a Miracle (2024)/128k/04) Rostislav Khalikov - Echo of First Love.mp3",
      genre: "relax piano",
      duration: "",
      is_active: true
    },
    {
      title: "Memories",
      artist: "Rostislav Khalikov",
      cover: "",
      audio: "https://dc.vmusic.ir/2024/07/Rostislav Khalikov - Waiting for a Miracle (2024)/128k/05) Rostislav Khalikov - Memories.mp3",
      genre: "relax piano",
      duration: "",
      is_active: true
    },
    {
      title: "Night Dream",
      artist: "Rostislav Khalikov",
      cover: "",
      audio: "https://dc.vmusic.ir/2024/07/Rostislav Khalikov - Waiting for a Miracle (2024)/128k/07) Rostislav Khalikov - Night Dream.mp3",
      genre: "relax piano",
      duration: "",
      is_active: true
    }
  ]
});

export default storeSimple;
