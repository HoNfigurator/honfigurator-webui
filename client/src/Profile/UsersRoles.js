import React from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, Popconfirm } from 'antd';
import { axiosInstanceServer } from '../Security/axiosRequestFormat';

const { Option } = Select;

function UserTable({ users, handleEditUser, handleDeleteUser }) {
    const columns = [
      {
        title: 'Discord ID',
        dataIndex: 'discord_id',
        key: 'discord_id',
      },
      {
        title: 'Nickname',
        dataIndex: 'nickname',
        key: 'nickname',
      },
      {
        title: 'Roles',
        dataIndex: 'roles',
        key: 'roles',
        render: roles => (roles ? roles.join(', ') : '')
      },
      {
        title: 'Actions',
        key: 'actions',
        render: (text, record) => (
          <Space>
            <Button onClick={() => handleEditUser(record.discord_id)}>Edit</Button>
            <Popconfirm
              title="Are you sure you want to delete this user?"
              onConfirm={() => handleDeleteUser(record.discord_id)}
              okText="Yes"
              cancelText="No"
            >
              <Button>Delete</Button>
            </Popconfirm>
          </Space>
        ),
      },
    ];
  
    return (
      <Table columns={columns} dataSource={users} />
    );
  }
  
  function RoleTable({ roles, handleEditRole, handleDeleteRole }) {
    const columns = [
      {
        title: 'Name',
        dataIndex: 'name',
        key: 'name',
      },
      {
        title: 'Permissions',
        dataIndex: 'permissions',
        key: 'permissions',
        render: permissions => {
          const parsedPermissions = JSON.parse(permissions);
          const truePermissions = Object.entries(parsedPermissions)
            .filter(([key, value]) => value === true)
            .map(([key, value]) => key);
          return truePermissions.join(', ');
        },
      },
      {
        title: 'Actions',
        key: 'actions',
        render: (text, record) => (
          <Space>
            <Button onClick={() => handleEditRole(record.name)}>Edit</Button>
            <Popconfirm
              title="Are you sure you want to delete this role?"
              onConfirm={() => handleDeleteRole(record.name)}
              okText="Yes"
              cancelText="No"
            >
              <Button>Delete</Button>
            </Popconfirm>
          </Space>
        ),
      },
    ];
  
    return <Table columns={columns} dataSource={roles} />;
  }
  

  function UsersandRoles() {
    const [users, setUsers] = React.useState([]);
    const [roles, setRoles] = React.useState([]);
    const [permissions, setPermissions] = React.useState([]);
  
    const [userModalVisible, setUserModalVisible] = React.useState(false);
    const [roleModalVisible, setRoleModalVisible] = React.useState(false);
  
    const [userForm] = Form.useForm();
    const [roleForm] = Form.useForm();
 
    const handleUserOk = async () => {
      try {
        const values = await userForm.validateFields();
        const payload = {
          nickname: values.nickname,
          discord_id: values.discord_id,
          roles: values.roles,
        };
        console.log(payload);
    
        if (editingUser) {
          const response = await axiosInstanceServer.post("/users/add", payload, {
            headers: {
              'Content-Type': 'application/json',
            },
          });
          console.log("editing user")
          setUsers(users.map((user) => (user.discord_id === editingUser.discord_id ? response.data : user)));
          setEditingUser(null);
        } else {
          console.log("adding user");
          const response = await axiosInstanceServer.post('/users/add', payload, {
            headers: {
              'Content-Type': 'application/json',
            },
          }).catch((error) => {
            console.log(error);
          });
          console.log("adding user");
    
          if (response.status === 201) {
            setUsers([...users, response.data]);
          } else {
            console.log('Error adding user:', response.data);
          }
        }
        setUserModalVisible(false);
        userForm.resetFields();
      } catch (error) {
        console.log(error);
      }
    };
    
      
  
    const handleRoleOk = async () => {
        try {
          const values = await roleForm.validateFields();
          const payload = {
            name: values.name,
            permissions: values.permissions,
          };
      
          if (editingRole) {
            const response = await axiosInstanceServer.post("/roles/add", payload);
            setRoles(roles.map((role) => (role.name === editingRole.name ? response.data : role)));
            setEditingRole(null);
          } else {
            const response = await axiosInstanceServer.post('/roles/add', payload, {
              headers: {
                'Content-Type': 'application/json',
              },
            });
      
            if (response.status === 201) {
              setRoles([...roles, response.data]);
            } else {
              console.log('Error adding role:', response.data);
            }
          }
          setRoleModalVisible(false);
          setRoleModalVisible(false);
            roleForm.resetFields();
        } catch (error) {
          console.log(error);
        }
      };
      
  
      const handleCancel = () => {
        setUserModalVisible(false);
        setRoleModalVisible(false);
        setEditingUser(null);
        setEditingRole(null);
        userForm.resetFields();
        roleForm.resetFields();
    };
      
  
    const [editingUser, setEditingUser] = React.useState(null);

    const handleEditUser = React.useCallback(
        (discord_id) => {
          const user = users.find((user) => user.discord_id === discord_id);
          console.log('Editing user:', user); // Add this line
          console.log(user.discord_id);
          if (user) {
            setEditingUser(user);
            userForm.setFieldsValue({
              nickname: user.nickname,
              discord_id: user.discord_id,
              roles: user.roles,
            });
            setUserModalVisible(true);
          }
        },
        [users]
      );
  
    const handleDeleteUser = async discord_id => {
        try {
          const response = await axiosInstanceServer.delete(`/users/delete/${discord_id}`);
          if (response.status === 200) {
            setUsers(users.filter(user => user.discord_id !== discord_id));
          } else {
            console.log('Error deleting user:', response.data);
          }
        } catch (error) {
          console.log(error);
        }
      };
          
  
    const [editingRole, setEditingRole] = React.useState(null);

    const handleEditRole = React.useCallback(
        (name) => {
          const role = roles.find((role) => role.name === name);
          if (role) {
            setEditingRole(role);
            roleForm.setFieldsValue({
              name: role.name,
              permissions: role.permissions,
            });
            setRoleModalVisible(true);
          }
        },
        [roles]
      );
  
    const handleDeleteRole = async id => {
      try {
        await axiosInstanceServer.delete(`/roles/delete/${id}`);
        setRoles(roles.filter(role => role.id !== id));
      } catch (error) {
        console.log(error);
      }
    };
  
    React.useEffect(() => {
      async function fetchData() {
        const usersResult = await axiosInstanceServer.get('/users/all');
        const rolesResult = await axiosInstanceServer.get('/roles/all');
        const permissionsResult = await axiosInstanceServer('/permissions/all');
        console.log('Users Result:', usersResult);
        console.log('Roles Result:', rolesResult);
        console.log('Permissions Result:', permissionsResult);
        setUsers(usersResult.data.filter(user => user.discord_id));
        setRoles(rolesResult.data);
        setPermissions(permissionsResult.data);
      }
      fetchData();
    }, []);

    const discordIdValidator = (rule, value) => {
      if (!value) {
        return Promise.reject('Please enter a Discord ID');
      }
      if (!/^[0-9]+$/.test(value)) {
        return Promise.reject(
          <span>
            Only numbers are allowed for Discord ID.{' '}
            <a
              href="https://www.businessinsider.com/guides/tech/discord-id#:~:text=To%20find%20a%20user's%20Discord,sidebar%20and%20select%20Copy%20ID."
              target="_blank"
              rel="noopener noreferrer"
            >
              Learn more
            </a>
          </span>
        );
      }
      return Promise.resolve();
    };
  
    return (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1>Users</h1>
            <Button onClick={() => setUserModalVisible(true)}>Add User</Button>
          </div>
          <UserTable 
            users={users} 
            handleEditUser={handleEditUser} 
            handleDeleteUser={handleDeleteUser} 
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1>Roles</h1>
            <Button onClick={() => setRoleModalVisible(true)}>Add Role</Button>
          </div>
          <RoleTable 
            roles={roles} 
            handleEditRole={handleEditRole} 
            handleDeleteRole={handleDeleteRole} 
          />
          <Modal
            title={editingUser ? 'Edit User' : 'Add User'}
            visible={userModalVisible}
            onOk={handleUserOk}
            onCancel={handleCancel}
            okText={editingUser ? 'Update' : 'Add'}
            cancelText="Cancel"
            id="userForm" // set the same value as the form prop
            >
            <Form form={userForm} layout="vertical">
                <Form.Item
                label="Nickname"
                name="nickname"
                rules={[{ required: true, message: 'Please enter a nickname' }]}
                >
                <Input />
                </Form.Item>
                <Form.Item
                  label="Discord ID"
                  name="discord_id"
                  rules={[
                    {
                      validator: discordIdValidator,
                    },
                  ]}
                >
                  <Input />
                </Form.Item>

                <Form.Item
                label="Roles"
                name="roles"
                rules={[{ required: true, message: 'Please select at least one role' }]}
                >
                <Select mode="multiple">
                    {roles.map(role => (
                    <Option key={role.id} value={role.name}>
                        {role.name}
                    </Option>
                    ))}
                </Select>
                </Form.Item>
            </Form>
            </Modal>
          <Modal
            title={editingRole ? 'Edit Role' : 'Add Role'}
            visible={roleModalVisible}
            onOk={handleRoleOk}
            onCancel={handleCancel}
            okText={editingRole ? 'Update' : 'Add'}
            cancelText="Cancel"
            id="roleForm" // set the same value as the form prop
            >
            <Form form={roleForm} layout="vertical">
              <Form.Item
              label="Name"
              name="name"
              rules={[{ required: true, message: 'Please enter a name' }]}
              >
              <Input />
              </Form.Item>
              <Form.Item
              label="Endpoints"
              name="permissions"
              rules={[{ required: true, message: 'Please select endpoints' }]}
              >
              <Select mode="multiple">
                  {Object.entries(permissions).map(([key, value]) => (
                  <Option key={key} value={key}>
                      {`${key}: ${value}`}
                  </Option>
                  ))}
              </Select>
              </Form.Item>
            </Form>
            </Modal>
        </div>
        );         
    }
export { UserTable };
export default UsersandRoles;
