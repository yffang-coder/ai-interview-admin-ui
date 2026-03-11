<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" label-width="80px" class="mb8">
      <el-form-item label="告警标题" prop="alarmTitle">
        <el-input v-model="queryParams.alarmTitle" placeholder="请输入告警标题" clearable style="width: 240px"
          @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['ai:alarm:add']">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate"
          v-hasPermi="['ai:alarm:update']">修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete"
          v-hasPermi="['ai:alarm:remove']">删除</el-button>
      </el-col>
      <!-- <el-col :span="2">
        <el-button type="warning" plain icon="Checked" :disabled="single" @click="handleProcess"
          v-hasPermi="['ai:alarm:handle']">处理</el-button>
      </el-col> -->
      <right-toolbar :show-search="showSearch" @update:showSearch="val => showSearch = val" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="alarms" @selection-change="handleSelectionChange" style="width: 100%">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column prop="alarmId" label="ID" width="120" />
      <el-table-column prop="alarmTitle" label="标题" show-overflow-tooltip />
      <el-table-column label="等级" width="120">
        <template #default="{ row }">
          {{ formatAlarmLevel(row.alarmLevel) }}
        </template>
      </el-table-column>
      <el-table-column prop="alarmType" label="类型" width="120" />
      <el-table-column prop="alarmContent" label="内容" show-overflow-tooltip />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          {{ formatStatus(row.status) }}
        </template>
      </el-table-column>
      <el-table-column prop="triggerTime" label="触发时间" width="180" />
      <el-table-column label="操作" width="220">
        <template #default="{ row }">
          <el-button type="text" @click="handleView(row)">查看</el-button>
          <el-button type="text" @click="handleUpdate(row)" v-hasPermi="['ai:alarm:update']">编辑</el-button>
          <!-- <el-button type="text" @click="handleProcess(row)" v-hasPermi="['ai:alarm:handle']">处理</el-button> -->
          <el-button type="text" @click="handleDelete(row)" v-hasPermi="['ai:alarm:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination :current-page="queryParams.pageNum" :page-size="queryParams.pageSize" :total="total" layout="total, prev, pager, next, jumper"
      @current-change="pageChange" @size-change="sizeChange" class="mt12" />

    <el-dialog :title="title" v-model="open" width="600px" @close="cancel">
      <el-form :model="form" ref="alarmRef" :rules="rules" label-width="100px">
        <template v-if="isHandle">
          <el-form-item label="处理结果" prop="handleResult">
            <el-input type="textarea" v-model="form.handleResult" placeholder="填写处理结果" rows="6" />
          </el-form-item>
        </template>
        <template v-else>
          <el-form-item label="标题" prop="alarmTitle">
            <el-input v-model="form.alarmTitle" placeholder="请输入标题" />
          </el-form-item>
          <el-form-item label="等级" prop="alarmLevel">
            <el-radio-group v-model="form.alarmLevel">
              <el-radio
                v-for="dict in alarmLevelOptions"
                :key="dict.value"
                :label="dict.value"
              >{{ dict.label }}</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="状态" prop="status">
            <el-radio-group v-model="form.status">
              <el-radio
                v-for="dict in statusOptions"
                :key="dict.value"
                :label="dict.value"
              >{{ dict.label }}</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="类型" prop="alarmType">
            <el-input v-model="form.alarmType" placeholder="请输入类型" />
          </el-form-item>
          <el-form-item label="内容" prop="alarmContent">
            <el-input type="textarea" v-model="form.alarmContent" placeholder="请输入内容" rows="4" />
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { listAlarm, delAlarm, addAlarm, updateAlarm, handleAlarm, getAlarm } from '../../../api/ai/alarm'
import useAlarmStore from '@/store/modules/alarm'
import { initStomp, disconnectStomp } from '@/plugins/stomp'
const { proxy } = getCurrentInstance()
const alarmStore = useAlarmStore()

const alarms = ref([])
const loading = ref(false)
const showSearch = ref(true)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const open = ref(false)
const title = ref('')
const currentRow = ref(null)

const data = reactive({
  form: {
    alarmId: undefined,
    alarmTitle: undefined,
    alarmLevel: undefined,
    alarmType: undefined,
    alarmContent: undefined,
    handleResult: undefined
  },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    alarmTitle: undefined
  },
  rules: {
    alarmTitle: [{ required: true, message: '标题不能为空', trigger: 'blur' }]
  }
})

const { queryParams, form, rules } = toRefs(data)

function reset() {
  form.value = {
    alarmId: undefined,
    alarmTitle: undefined,
    alarmLevel: undefined,
    alarmType: undefined,
    alarmContent: undefined,
    handleResult: undefined
  }
  proxy.resetForm('alarmRef')
}

function submitForm() {
  proxy.$refs['alarmRef'].validate(valid => {
    if (!valid) return
    // handle dialog action based on title
    if (title.value && title.value.includes('处理')) {
      const id = form.value.alarmId
      if (!id) return
      handleAlarm(id, form.value.handleResult).then(() => {
        proxy.$modal.msgSuccess('处理成功')
        open.value = false
        getList()
      })
    } else {
      if (form.value.alarmId != undefined) {
        updateAlarm(form.value).then(() => {
          proxy.$modal.msgSuccess('修改成功')
          open.value = false
          getList()
        })
      } else {
        addAlarm(form.value).then(() => {
          proxy.$modal.msgSuccess('新增成功')
          open.value = false
          getList()
        })
      }
    }
  })
}

function cancel() {
  open.value = false
  reset()
}
// --- display helpers ---
const alarmLevelMap = {
  '0': '低级',
  '1': '中级',
  '2': '高级',
  '3': '紧急'
}
const alarmLevelOptions = [
  { value: '0', label: '低级' },
  { value: '1', label: '中级' },
  { value: '2', label: '高级' },
  { value: '3', label: '紧急' }
]

const statusOptions = [
  { value: '0', label: '未处理' },
  { value: '1', label: '处理中' },
  { value: '2', label: '已处理' },
  { value: '3', label: '已忽略' }
]
const statusMap = {
  '0': '未处理',
  '1': '处理中',
  '2': '已处理',
  '3': '已忽略'
}
function formatAlarmLevel(level) {
  return alarmLevelMap[String(level)] || level || '-'
}
function formatStatus(status) {
  return statusMap[String(status)] || status || '-'
}
function getList() {
  loading.value = true
  listAlarm(queryParams.value).then(res => {
    // expecting rows/total
    alarms.value = res.rows || []
    total.value = res.total || 0
    loading.value = false
  }).catch(() => {
    loading.value = false
  })
}

function handleQuery() {
  queryParams.pageNum = 1
  getList()
}
function resetQuery() {
  proxy.resetForm('queryRef')
  queryParams.pageNum = 1
  queryParams.alarmTitle = undefined
  getList()
}

function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.alarmId)
  single.value = selection.length != 1
  multiple.value = !selection.length
}

function handleAdd() {
  reset()
  currentRow.value = null
  title.value = '新增告警'
  open.value = true
}
function handleUpdate(row) {
  reset()
  const id = row && row.alarmId || ids.value
  getAlarm(id).then(response => {
    form.value = response.data
    currentRow.value = response.data
    open.value = true
  })
  title.value = '编辑告警'
}
function handleView(row) {
  reset()
  const id = row && row.alarmId || ids.value
  getAlarm(id).then(response => {
    form.value = response.data
    currentRow.value = response.data
    open.value = true
  })
  title.value = '告警详情'
}
function handleDelete(row) {
  const alarmIds = row ? row.alarmId : ids.value
  proxy.$modal.confirm('确认删除编号为 "' + alarmIds + '" 的告警吗？').then(() => {
    return delAlarm(alarmIds)
  }).then(() => {
    proxy.$modal.msgSuccess('删除成功')
    getList()
  }).catch(() => {})
}

function handleProcess(row) {
  currentRow.value = row || {}
  title.value = '处理告警'
  open.value = true
}

function pageChange(page) {
  queryParams.pageNum = page
  getList()
}
function sizeChange(size) {
  queryParams.pageSize = size
  getList()
}

onMounted(() => {
  getList()
  // init stomp to receive push messages
  // initStomp(payload => {
  //   // push to store and refresh list top
  //   alarmStore.addAlarm(payload)
  //   proxy.$modal.msgInfo && proxy.$modal.msgInfo('收到新告警：' + (payload.alarmTitle || ''))
  // })
})
onBeforeUnmount(() => {
  // disconnectStomp()
})

</script>
 
 
