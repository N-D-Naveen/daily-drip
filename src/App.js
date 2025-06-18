import './App.css';
import React, { useEffect, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

let taskCount = 1;
function App() {
  const [isTableChanged, setIsTableChanged] = useState(false);
  const [originalData, setOrginalData] = useState(null);
  var [userId, setUserId] = useState(1);
  var [rowData, setRowData] = useState([]);
  const [isLoading, setLoader] = useState(false);
  const [colDefs, setColDefs] = useState([
    { field: "description", headerName: 'Task', flex: 1, editable: true },
    {
      field: "status", width: 250, editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: [
          "1. To Do",
          "2. Test Case In Progress",
          "3. Test Case Completed",
          "4. Test Case Verified",
          "5. Planning In Progress",
          "6. Planning Completed",
          "7. Planning Verified",
          "8. Development In Progress",
          "9. Development Completed",
          "10. Development Verified",
          "11. Testing In Progress",
          "12. Testing Completed",
          "13. Testing Verified",
          "14. Done"
        ]
      },
      valueFormatter: params => {
        return params.value; // you can enhance display if needed
      }, sort: "desc"
    },
    {
      field: "estimatedDays", width: 150, editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: [
          "0.5",
          "1",
          "2",
          "3",
          "4",
          "5"
        ]
      },
      valueFormatter: params => {
        return params.value; // you can enhance display if needed
      }
    },
    {
      field: "weightage", width: 150, editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: [
          "1",
          "2",
          "3",
          "4",
          "5",
          "6",
          "7",
          "8",
          "9",
          "10"
        ]
      },
      valueFormatter: params => {
        return params.value; // you can enhance display if needed
      }
    },
    {
      field: "workLocation", width: 150, editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: [
          "HOME",
          "OFFICE"
        ]
      },
      valueFormatter: params => {
        return params.value; // you can enhance display if needed
      }
    }
  ]);

  const [colDefs2, setColDefs2] = useState([
    { field: "description", headerName: 'Completed Task', flex: 1 }
  ]);

  const handleUserChange = (e) => {
    setUserId(Number(e.target.value));
    getTasks(Number(e.target.value));
  }

  const handleSave = () => {
    console.log(rowData, "rowData", originalData);
    setLoader(true);
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    rowData = rowData.filter(v => v.description);
    let newlyAddedData = rowData.filter(v => v.id.startsWith("dummy"));
    let updatedData = rowData.filter(v => !v.id.startsWith("dummy")).filter((v, idx) => JSON.stringify(v) != JSON.stringify(originalData[idx]));
    debugger;
    newlyAddedData = newlyAddedData.map((v) => {
      v["userId"] = userId.toString();
      if (v.status != "Created") {
        v["statusHistory"] = [
          {
            "status": "Created",
            "timestamp": new Date().toISOString()
          },
          {
            "status": v.status,
            "timestamp": new Date().toISOString()
          }]
      }
      else
        v["statusHistory"] = [
          {
            "status": "Created",
            "timestamp": new Date().toISOString()
          }]
      return v;
    })
    updatedData = updatedData.map(v => {
      let oldData = originalData.find(v2 => v2.taskId == v.taskId);
      //if status not changed dont update the time stamp
      if (oldData.status != v.status) {
        let isExist = v["statusHistory"].filter((v1) => {
          if (v1.status == v.status) return true;
          else return false
        })
        //to handle the new status where it wont be available in statusHistory
        if (isExist.length)
          v["statusHistory"] = v["statusHistory"].map(v1 => {
            if (v1.status == v.status) v1["timestamp"] = new Date().toISOString()
            return v1;
          })
        else {
          v["statusHistory"].push({
            "status": v.status,
            "timestamp": new Date().toISOString()
          })
        }
      }
      return v;
    })
    const raw = JSON.stringify({ "create": newlyAddedData, "edit": updatedData });

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow"
    };

    fetch("https://qmhxbzrg97.execute-api.us-east-1.amazonaws.com/TaskManagement", requestOptions)
      .then((response) => response.text())
      .then((result) => { console.log(result); getTasks(userId); setIsTableChanged(false); })
      .catch((error) => console.error(error));
  }

  const handleCreate = () => {
    setIsTableChanged(true);
    const newRow = { description: "", status: "1.TODO", id: "dummy" + (taskCount + 1), "weightage": "3", estimatedDays: "1",workLocation:"OFFICE" };
    setRowData(prevData => [...prevData, newRow]);
  }

  const getTasks = (userId) => {
    //Call the get task API
    const requestOptions = {
      method: "GET",
      redirect: "follow"
    };

    fetch(`https://qmhxbzrg97.execute-api.us-east-1.amazonaws.com/TaskManagement?userId=${userId}`, requestOptions)
      .then((response) => response.json())
      .then((result) => { console.log(result); setLoader(false); setOrginalData(JSON.parse(JSON.stringify(result))); setRowData(result) })
      .catch((error) => console.error(error));
  }
  useEffect(() => {
    setLoader(true);
    getTasks(userId);
  }, [])

  const onCellValueChanged = () => {
    setIsTableChanged(true);
  }

  return (
    <div className="App">
      {isLoading ? <div className='loaderContainer'><span className="loader"></span></div> : null}
      <div className='headerContainer'>
        <div className='headerTile'>TASK MANAGEMENT APP</div>
        <div >
          <button type="button" onClick={handleSave} disabled={!isTableChanged}>SAVE</button>
        </div>
        <div>
          <button type="button" onClick={handleCreate}>CREATE</button>
        </div>
        <div>
          <select name="User" id="user-id" onChange={handleUserChange}>
            <option value="1">REETHU</option>
            <option value="2">ATHUL</option>
          </select>
        </div>
      </div>
      <div className='tableContainer'>
        <div style={{ height: 500, width: "100%" }}>
          <AgGridReact
            rowData={rowData.filter(v => v.status != "14. Done")}
            columnDefs={colDefs}
            onCellValueChanged={onCellValueChanged}
            pagination={true}
            getRowStyle={(params) => {
              const taskStartDate = params?.data?.statusHistory?.find(v => v.status === "2.Test Case In Progress");
              const estimatedDays = Number(params.data.estimatedDays);

              if (taskStartDate?.timestamp) {
                const dueDate = new Date(taskStartDate.timestamp);
                dueDate.setDate(dueDate.getDate() + estimatedDays);

                if (new Date() > dueDate) {
                  return { backgroundColor: '#ffcccc' }; // light red for overdue
                }
              }

              return null;
            }}
          />
        </div>
        <div style={{ height: 500, width: "100%", marginTop: "30px" }}>
          <AgGridReact
            rowData={rowData.filter(v => v.status == "14. Done")}
            columnDefs={colDefs2}
            pagination={true}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
