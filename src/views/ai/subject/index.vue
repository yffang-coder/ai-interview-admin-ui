<template>
   <div class="app-container">
      <el-form :model="queryParams" ref="queryRef" v-show="showSearch" :inline="true" label-width="68px">
         <el-form-item label="标题" prop="name">
            <el-input v-model="queryParams.name" placeholder="请输入名称" clearable style="width: 240px"
               @keyup.enter="handleQuery" />
         </el-form-item>
         <el-form-item label="文本" prop="text">
            <el-input v-model="queryParams.text" placeholder="请输入文本" clearable style="width: 240px"
               @keyup.enter="handleQuery" />
         </el-form-item>
         <el-form-item>
            <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
            <el-button icon="Refresh" @click="resetQuery">重置</el-button>
         </el-form-item>
      </el-form>
      <el-row :gutter="10" class="mb8">
         <el-col :span="1.5">
            <el-button type="primary" plain icon="Plus" @click="handleAdd"
               v-hasPermi="['ai:category:add']">新增</el-button>
         </el-col>
         <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate"
               v-hasPermi="['ai:category:update']">修改</el-button>
         </el-col>
         <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete"
               v-hasPermi="['ai:category:remove']">删除</el-button>
         </el-col>
         <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
      </el-row>

      <!-- 表格数据 -->
      <el-table v-loading="loading" :data="categories" @selection-change="handleSelectionChange">
         <el-table-column type="selection" width="55" align="center" />
         <el-table-column label="编号" prop="id" width="120" />
         <el-table-column label="名称" prop="name" :show-overflow-tooltip="true" width="150" />
         <el-table-column label="文本" prop="text" :show-overflow-tooltip="true" width="150" />
         <el-table-column label="图标" width="100">
            <template #default="scope">
               <img :src="scope.row.src" alt="banner" style="width: 85px; height: 48px;">
            </template>
         </el-table-column>/>

         <el-table-column label="是否启用">
            <template #default="scope">
               <el-switch v-model="scope.row.enable" @change="handleEnableChange(scope.row)" size="small"
                  active-text="启用" inactive-text="禁用">
               </el-switch>

            </template>
         </el-table-column>/>

         <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
            <template #default="scope">
               <el-tooltip content="修改" placement="top" v-if="scope.row.id !== 1">
                  <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)"
                     v-hasPermi="['ai:category:edit']"></el-button>
               </el-tooltip>
               <el-tooltip content="删除" placement="top" v-if="scope.row.id !== 1">
                  <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)"
                     v-hasPermi="['ai:category:remove']"></el-button>
               </el-tooltip>
            </template>
         </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum"
         v-model:limit="queryParams.pageSize" @pagination="getList" />

      <!-- 添加或修改科目配置对话框 -->
      <el-dialog :title="title" v-model="open" width="500px" append-to-body>
         <el-form ref="categoryRef" :model="form" :rules="rules" label-width="100px">
            <el-form-item label="名称" prop="name">
               <el-input v-model="form.name" placeholder="请输入名称" />
            </el-form-item>
            <el-form-item label="文本" prop="text">
               <el-input v-model="form.text" placeholder="请输入文本" />
            </el-form-item>
            <el-form-item label="排序字段" prop="orderNum">
               <el-input-number v-model="form.orderNum" controls-position="right" :min="0" />
            </el-form-item>
            <el-form-item label="图标" prop="src">
               <el-upload action="/dev-api/file/upload" :headers="headerObj" :limit="1" :on-success="fileUploadSuccess">
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

import { orderBy } from "element-plus/es/components/table/src/util.mjs"
import { listBanner, addBanner, getBanner, updateBanner, delBanner } from "../../../api/ai/banner"
import { addCategory, delCategory, getCategory, listCategory, updateCategory } from "../../../api/ai/category"
import { getToken } from "../../../utils/auth"
const router = useRouter()
const { proxy } = getCurrentInstance()

const categories = ref([])
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
      name: undefined,
      text: undefined
   },
   rules: {
      text: [{ required: true, message: "文本不能为空", trigger: "blur" }],
      name: [{ required: true, message: "名称不能为空", trigger: "blur" }],
      orderNum: [{ required: true, message: "排序字段不能为空", trigger: "blur" }]
   },
})

const { queryParams, form, rules } = toRefs(data)

function handleEnableChange(row) {
   form.value = row;
   updateCategory(form.value).then(response => {
      proxy.$modal.msgSuccess("修改成功")
      open.value = false
      getList()
   })
}
function fileUploadSuccess(res) {
   form.value.src = res.msg
   console.log(res.msg)
}

/** 查询科目列表 */
function getList() {
   loading.value = true
   listCategory(proxy.addDateRange(queryParams.value, dateRange.value)).then(response => {
      categories.value = response.rows
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
   const categoryIds = row.id || ids.value
   proxy.$modal.confirm('是否确认删除编号为"' + categoryIds + '"的数据项?').then(function () {
      return delCategory(categoryIds)
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
      text: undefined,
      src: undefined,
      orderNum: undefined,
      name: undefined
   }
   proxy.resetForm("categoryRef")
}

/** 添加科目 */
function handleAdd() {
   reset()
   open.value = true
   title.value = "添加科目"
}

/** 修改科目 */
function handleUpdate(row) {
   reset()
   const id = row.id || ids.value
   getCategory(id).then(response => {
      form.value = response.data
      open.value = true
   })
   title.value = "修改category"
}

/** 提交按钮 */
function submitForm() {
   proxy.$refs["categoryRef"].validate(valid => {
      if (valid) {
         if (form.value.id != undefined) {
            updateCategory(form.value).then(response => {
               proxy.$modal.msgSuccess("修改成功")
               open.value = false
               getList()
            })
         } else {
            addCategory(form.value).then(response => {
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
