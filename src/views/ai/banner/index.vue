<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" v-show="showSearch" :inline="true" label-width="68px">
      <el-form-item label="标题" prop="title">
        <el-input v-model="queryParams.title" placeholder="请输入名称" clearable style="width: 240px"
          @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['ai:banner:add']">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate"
          v-hasPermi="['ai:banner:update']">修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete"
          v-hasPermi="['ai:banner:remove']">删除</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <!-- 表格数据 -->
    <el-table v-loading="loading" :data="bannerList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="Banner编号" prop="id" width="120" />
      <el-table-column label="Banner名称" prop="title" :show-overflow-tooltip="true" width="150" />
      <el-table-column label="连接地址" prop="url" :show-overflow-tooltip="true" width="450" />
      <el-table-column label="Banner图片" width="100">
        <template #default="scope">
          <img :src="scope.row.image" alt="banner" style="width: 85px; height: 48px;">
        </template>
      </el-table-column>/>

      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-tooltip content="修改" placement="top" v-if="scope.row.id !== 1">
            <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)"
              v-hasPermi="['ai:banner:edit']"></el-button>
          </el-tooltip>
          <el-tooltip content="删除" placement="top" v-if="scope.row.id !== 1">
            <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)"
              v-hasPermi="['ai:banner:remove']"></el-button>
          </el-tooltip>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize" @pagination="getList" />

    <!-- 添加或修改角色配置对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="bannerRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="名称" prop="title">
          <el-input v-model="form.title" placeholder="请输入名称" />
        </el-form-item>
        <el-form-item label="链接" prop="url">
          <el-input v-model="form.url" placeholder="请输入链接" />
        </el-form-item>
         <el-form-item label="排序字段" prop="orderNum">
              <el-input-number v-model="form.orderNum" controls-position="right" :min="0" />
            </el-form-item>
        <el-form-item label="图片" prop="image">
          <el-upload action="/prod-api/file/upload" :headers="headerObj" 
          :limit="1"
          :on-success="fileUploadSuccess">
            <el-button type="primary">上传图片</el-button>
          </el-upload>
        </el-form-item>
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

<script setup name="Role">

import { listBanner ,addBanner, getBanner, updateBanner, delBanner} from "../../../api/ai/banner"
import { getToken } from "../../../utils/auth"
const router = useRouter()
const { proxy } = getCurrentInstance()

const bannerList = ref([])
const open = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const title = ref("")
const dateRange = ref([])
const headerObj = ref({ Authorization: "Bearer " + getToken() })


const data = reactive({
  form: {
   
  },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    title: undefined
  },
  rules: {
    title: [{ required: true, message: "名称不能为空", trigger: "blur" }],
    url: [{ required: true, message: "链接不能为空", trigger: "blur" }],
    orderNum: [{ required: true, message: "排序字段不能为空", trigger: "blur" }]
  },
})

const { queryParams, form, rules } = toRefs(data)


function fileUploadSuccess(res) {
  form.value.image = res.msg
  console.log(res.msg)
} 

/** 查询角色列表 */
function getList() {
  loading.value = true
  listBanner(proxy.addDateRange(queryParams.value, dateRange.value)).then(response => {
    bannerList.value = response.rows
    total.value = response.total
    loading.value = false
  })
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

/** 重置按钮操作 */
function resetQuery() {
  dateRange.value = []
  proxy.resetForm("queryRef")
  handleQuery()
}

/** 删除按钮操作 */
function handleDelete(row) {
  const bannerIds = row.id || ids.value
  proxy.$modal.confirm('是否确认删除编号为"' + bannerIds + '"的数据项?').then(function () {
    return delBanner(bannerIds)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => { })
}


/** 多选框选中数据 */
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.id)
  single.value = selection.length != 1
  multiple.value = !selection.length
}

/** 重置新增的表单以及其他数据  */
function reset() {
  form.value = {
    id: undefined,
    title: undefined,
    url: undefined,
    image: undefined,
    orderNum: undefined
  }
  proxy.resetForm("bannerRef")
}

/** 添加角色 */
function handleAdd() {
  reset()
  open.value = true
  title.value = "添加角色"
}

/** 修改角色 */
function handleUpdate(row) {
  reset()
  const id = row.id || ids.value
  getBanner(id).then(response => {
    form.value = response.data
    open.value = true
  })
  title.value = "修改Banner"
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["bannerRef"].validate(valid => {
    if (valid) {
      if (form.value.id != undefined) {
        updateBanner(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功")
          open.value = false
          getList()
        })
      } else {
        addBanner(form.value).then(response => {
          proxy.$modal.msgSuccess("新增成功")
          open.value = false
          getList()
        })
      }
    }
  })
}

/** 取消按钮 */
function cancel() {
  open.value = false
  reset()
}


getList()
</script>
