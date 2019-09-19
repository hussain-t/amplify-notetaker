// import React, { useState, useEffect } from 'react';
// import { withAuthenticator } from 'aws-amplify-react';
// import { API, graphqlOperation } from "aws-amplify";
// import { createNote , deleteNote, updateNote } from "./graphql/mutations";
// import { listNotes } from "./graphql/queries";

// // https://amdy3ox3dfgrhaqgltdvmo6hbm.appsync-api.ap-south-1.amazonaws.com/graphql

// function App() {
//   const [notes, setNotes] = useState([]);
//   const [id, setId] = useState("");
//   const [note, setNote] = useState("");
//   const [showUpdateBtn, setShowUpdateBtn] = useState(false);

//   const getNotes = async () => {
//     const result = await API.graphql(graphqlOperation(listNotes));
//     const newNotes = result.data.listNotes.items;
//     setNotes(newNotes);
//   }

//   useEffect(() => {
//     getNotes();
//   }, [notes]);

//   const clearInput = () => {
//     setNote("");
//     setId("");
//   }

//   const handleChangeNote = event => setNote(event.target.value);

//   const hasExistingNote = () => {
//     if (id) {
//       return notes.findIndex(note => note.id === id) > -1;
//     }
//     return false;
//   }

//   const handleAddNote = async event => {
//     event.preventDefault();
//     if (hasExistingNote()) {
//       handleUpdateNote();
//     } else {
//       const input = { note }
//       const result = await API.graphql(graphqlOperation(createNote, { input }));
//       const newNote = result.data.createNote;
//       setNotes(notes => [newNote, ...notes]);
//       clearInput();
//     }
//   }

//   const handleUpdateNote = async () => {
//     const input = { id, note }
//     const result = await API.graphql(graphqlOperation(updateNote, { input }));
//     const updatedNote = result.data.updateNote;
//     setNotes(notes => {
//       // Approach 1
//       // const updatedNote = notes.find(note => note.id === updatedNoteId);
//       const index = notes.findIndex(note => note.id === updatedNote.id);
//       console.log("index", index);
//       // return [
//       //   ...notes.slice(0, index),
//       //   updatedNote,
//       //   ...notes.slice(index + 1)
//       // ];
//       // Approach 2 (my approach)
//       const filteredNotes = notes.filter(note => note.id !== updatedNote.id);
//       return [updatedNote, ...filteredNotes];
//     });
//     clearInput();
//   }

//   const handleDeleteNote = async noteId => {
//     const input = { id: noteId };
//     const result = await API.graphql(graphqlOperation(deleteNote, { input }));
//     const deletedNoteId = result.data.deleteNote.id;
//     setNotes(notes => notes.filter(note => note.id !== deletedNoteId));
//     clearInput();
//   }

//   const handleSelectedNote = ({ id, note }) => {
//     setId(id);
//     setNote(note);
//   }

//   return (
//     <div
//       className="flex flex-column items-center justify-center pa3 bg-washed-red"
//     >
//       <h1 className="code fa-l">Amplify Notetaker</h1>
//       <form onSubmit={handleAddNote} className="mb3">
//         <input
//           type="text"
//           className="pa2 f4"
//           placeholder="Write your note"
//           onChange={handleChangeNote}
//           value={note}
//         />
//         <button className="pa2 f4" type="submit">
//           {id ? "Update Note" : "Add Note"}
//         </button>
//       </form>
//       <div>
//         {notes.map(note => (
//           <div key={note.id} className="flex items-center">
//             <li
//               className="list pa1 f3"
//               onClick={() => handleSelectedNote(note)}
//             >
//               {note.note}
//             </li>
//             <button
//               className="bg-transparent bn f4"
//               onClick={() => handleDeleteNote(note.id)}
//             >
//               <span>&times;</span>
//             </button>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// export default withAuthenticator(App, {
//   includeGreetings: true,
// });



import React, { useState, useEffect } from 'react';
import { withAuthenticator } from 'aws-amplify-react';
import { API, graphqlOperation } from "aws-amplify";
import { createNote , deleteNote, updateNote } from "./graphql/mutations";
import { listNotes } from "./graphql/queries";
import { onCreateNote, onDeleteNote, onUpdateNote } from "./graphql/subscriptions";

// https://amdy3ox3dfgrhaqgltdvmo6hbm.appsync-api.ap-south-1.amazonaws.com/graphql

function App() {
  const [notes, setNotes] = useState([]);
  const [id, setId] = useState("");
  const [note, setNote] = useState("");

  const getNotes = async () => {
    const result = await API.graphql(graphqlOperation(listNotes));
    const newNotes = result.data.listNotes.items;
    setNotes(newNotes);
  }

  useEffect(() => {
    getNotes();
    const createNoteListner = API.graphql(graphqlOperation(onCreateNote)).subscribe({
      next: newData => {
        const { value: { data: { onCreateNote: newNote } } } = newData;
        console.log("newNotwe", newNote)
        setNotes(notes => {
          const previousNotes = notes.filter(note => note.id !== newNote.id);
          return [...previousNotes, newNote];
        })
      }
    })
    const deleteNoteListener = API.graphql(graphqlOperation(onDeleteNote)).subscribe({
      next: deletedNote => {
        const data = deletedNote.value.data.onDeleteNote;
        setNotes(notes => {
          const previousNotes = notes.filter(note => note.id !== data.id);
          return [...previousNotes];
        })
      }
    })
    const updateNoteListener = API.graphql(graphqlOperation(onUpdateNote)).subscribe({
      next: updatedNote => {
        const data = updatedNote.value.data.onUpdateNote;
        setNotes(notes => {
          const previousNotes = notes.filter(note => note.id !== data.id);
          return [data, ...previousNotes];
        })
      }
    })
    return () => {
      createNoteListner.unsubscribe();
      deleteNoteListener.unsubscribe();
      updateNoteListener.unsubscribe();
    }
  }, []);

  const clearInput = () => {
    setNote("");
    setId("");
  }

  const handleChangeNote = event => setNote(event.target.value);

  const hasExistingNote = () => {
    if (id) {
      return notes.findIndex(note => note.id === id) > -1;
    }
    return false;
  }

  const handleAddNote = async event => {
    event.preventDefault();
    if (hasExistingNote()) {
      handleUpdateNote();
    } else {
      const input = { note }
      await API.graphql(graphqlOperation(createNote, { input }));
      // const newNote = result.data.createNote;
      // setNotes(notes => [newNote, ...notes]);
      clearInput();
    }
  }

  const handleUpdateNote = async () => {
    const input = { id, note }
    await API.graphql(graphqlOperation(updateNote, { input }));
    // const updatedNote = result.data.updateNote;
    // setNotes(notes => {
    //   // Approach 1
    //   // const updatedNote = notes.find(note => note.id === updatedNoteId);
    //   const index = notes.findIndex(note => note.id === updatedNote.id);
    //   console.log("index", index);
    //   // return [
    //   //   ...notes.slice(0, index),
    //   //   updatedNote,
    //   //   ...notes.slice(index + 1)
    //   // ];
    //   // Approach 2 (my approach)
    //   const filteredNotes = notes.filter(note => note.id !== updatedNote.id);
    //   return [updatedNote, ...filteredNotes];
    // });
    clearInput();
  }

  const handleDeleteNote = async noteId => {
    const input = { id: noteId };
    await API.graphql(graphqlOperation(deleteNote, { input }));
    // const deletedNoteId = result.data.deleteNote.id;
    // setNotes(notes => notes.filter(note => note.id !== deletedNoteId));
    clearInput();
  }

  const handleSelectedNote = ({ id, note }) => {
    setId(id);
    setNote(note);
  }

  return (
    <div
      className="flex flex-column items-center justify-center pa3 bg-washed-red"
    >
      <h1 className="code fa-l">Amplify Notetaker</h1>
      <form onSubmit={handleAddNote} className="mb3">
        <input
          type="text"
          className="pa2 f4"
          placeholder="Write your note"
          onChange={handleChangeNote}
          value={note}
        />
        <button className="pa2 f4" type="submit">
          {id ? "Update Note" : "Add Note"}
        </button>
      </form>
      <div>
        {notes.map(note => (
          <div key={note.id} className="flex items-center">
            <li
              className="list pa1 f3"
              onClick={() => handleSelectedNote(note)}
            >
              {note.note}
            </li>
            <button
              className="bg-transparent bn f4"
              onClick={() => handleDeleteNote(note.id)}
            >
              <span>&times;</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default withAuthenticator(App, {
  includeGreetings: true,
});
