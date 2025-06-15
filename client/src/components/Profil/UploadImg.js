// import { useState } from "react"
// import { useDispatch, useSelector } from "react-redux"
// import { uploadPicture } from "../../actions/user.actions"
// import './UploadImg.css'

// const UploadImg = () => {
//     const [file, setFile] = useState()
//     const dispatch = useDispatch()
//     const userData = useSelector((state) => state.userReducer)

//     const handlePicture = (e) => {
//         e.preventDefault()
//         const data = new FormData()
//         data.append("name", userData.pseudo)
//         data.append("userId", userData._id)
//         data.append("file", file)

//         dispatch(uploadPicture(data, userData._id))
//     }

//     return (
//         <form action="" onSubmit={handlePicture} className="upload-pic">
//             <label htmlFor="file">Changer d'image</label>
//             <input
//                 type="file"
//                 id="file"
//                 name="file"
//                 accept=".jpg, .jpeg, .png"
//                 onChange={(e) => setFile(e.target.files[0])}
//                 className="upload-pic-btn"
//             />
//             <br/>
//             <input type="submit" value="Envoyer" className="upload-pic-send"/>
//             <p className="error-message-profil"></p>
//         </form>
//         <div></div>
//     )
// }

// export default UploadImg
